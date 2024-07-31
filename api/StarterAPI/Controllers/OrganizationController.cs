using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression;
using StarterAPI.Models;
using StarterAPI.Data;

namespace StarterAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrganizationController : ControllerBase
    {
        // Dependency injection of the data context
        private readonly StarterAPIContext _context;

        // Creating a static HttpClient instance
        private static readonly HttpClient HttpClient = new HttpClient();

        // Constant for maximum records allowed in the database
        private const int MaxRecords = 5000;

        public OrganizationController(StarterAPIContext context)
        {
            // Assigning the injected context to the private field
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult> Get(string search = null, int page = 1, int pageSize = 10)
        {
            // Using EF to create a queryable to build dynamic queries.
            // The query to the database can change depending on the input parameters.
            var query = _context.Organization.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                // Using EF to filter by search term
                query = query.Where(o => o.OrgName.Contains(search) || o.EIN.Contains(search));
            }

            // Using EF to count total records
            var totalRecords = await query.CountAsync();

            // Using EF to order the results, skip records for pagination, and take the page size
            var items = await query.OrderBy(o => o.OrgName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Calculating total pages and projecting the results
            var result = new
            {
                totalRecords,
                totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize),
                items = items.Select(item => new
                {
                    item.ID,
                    item.EIN,
                    item.OrgName,
                    item.City,
                    item.State,
                    item.Country,
                    item.Status
                }).ToList()
            };

            // Returning the result as JSON
            return new JsonResult(result);
        }

        [HttpPost("fetch-irs-data")]
        public async Task<ActionResult> FetchAndUploadIrsData()
        {
            // URL for IRS data
            string url = "https://apps.irs.gov/pub/epostcard/data-download-pub78.zip";

            // Temporary path for the zip file
            string tempPath = Path.Combine(Path.GetTempPath(), "data-download-pub78.zip");

            // Extraction path for the zip file
            string extractPath = Path.Combine(Path.GetTempPath(), "data-download-pub78");

            try
            {
                // Downloading the file
                var response = await HttpClient.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);

                // Ensuring the request was successful
                response.EnsureSuccessStatusCode();

                // Saving the file to the temp path
                await using (var fileStream =
                             new FileStream(tempPath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    var buffer = new byte[81920]; // Buffer for reading data
                    var stream = await response.Content.ReadAsStreamAsync(); // Getting the response stream
                    int bytesRead;

                    // Reading from the stream and writing to the file
                    while ((bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length)) > 0)
                    {
                        await fileStream.WriteAsync(buffer, 0, bytesRead);
                    }
                }

                // Deleting existing directory if it exists
                if (Directory.Exists(extractPath))
                {
                    Directory.Delete(extractPath, true);
                }

                // Extracting the zip file
                ZipFile.ExtractToDirectory(tempPath, extractPath);

                // Finding the extracted text files
                var txtFiles = Directory.GetFiles(extractPath, "*.txt");
                if (txtFiles.Length == 0)
                {
                    // Error if no text files found
                    return StatusCode(StatusCodes.Status500InternalServerError,
                        new { error = "No TXT files found in the extracted archive." });
                }

                // Assuming the first text file
                var txtFilePath = txtFiles[0];

                // List to hold organization records
                var records = new List<Organization>();
                using (var reader = new StreamReader(txtFilePath))
                {
                    string line;

                    // Reading lines from the file
                    while ((line = await reader.ReadLineAsync()) != null)
                    {
                        var parts = line.Split('|'); // Splitting the line by pipe character
                        if (parts.Length == 6)
                        {
                            records.Add(new Organization
                            {
                                EIN = parts[0],
                                OrgName = parts[1],
                                City = parts[2],
                                State = parts[3],
                                Country = parts[4],
                                Status = parts[5]
                            });
                        }
                    }
                }

                // Using EF to count records in the database
                var totalRecordsInDb = await _context.Organization.CountAsync();
                if (totalRecordsInDb >= MaxRecords)
                {
                    // Error if max limit reached for debugging purposes
                    return StatusCode(StatusCodes.Status400BadRequest, new { error = "Maximum record limit reached." });
                }

                // Uploading data to the database in batches
                const int batchSize = 100;
                for (int i = 0; i < records.Count; i += batchSize)
                {
                    // Taking a batch of records
                    var batch = records.Skip(i).Take(batchSize).ToList();

                    // Using EF to find existing records in the batch
                    var existingRecords = await _context.Organization
                        .AsNoTracking()
                        .Where(o => batch.Select(b => b.EIN).Contains(o.EIN))
                        .ToListAsync();

                    // Filtering out existing records
                    var newRecords = batch.Where(b => existingRecords.All(e => e.EIN != b.EIN)).ToList();

                    // Ensuring max limit is not exceeded
                    if (totalRecordsInDb + newRecords.Count > MaxRecords)
                    {
                        newRecords = newRecords.Take(MaxRecords - totalRecordsInDb).ToList();
                    }

                    // Using EF to add new records to the context and saving changes to the database
                    await _context.Organization.AddRangeAsync(newRecords);
                    await _context.SaveChangesAsync();

                    // Updating the total record count
                    totalRecordsInDb += newRecords.Count;

                    // Breaking if max limit is reached
                    if (totalRecordsInDb >= MaxRecords)
                    {
                        break;
                    }
                }

                // Returning success message
                return new JsonResult(new { message = "IRS data fetched and uploaded successfully" });
            }
            catch (Exception ex)
            {
                // Returning error message
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = ex.Message });
            }
            finally
            {
                // Deleting the temporary zip file
                if (System.IO.File.Exists(tempPath))
                {
                    System.IO.File.Delete(tempPath);
                }

                // Deleting the extracted directory
                if (Directory.Exists(extractPath))
                {
                    Directory.Delete(extractPath, true);
                }
            }
        }

        // For testing purposes only. This would not be used in production.
        [HttpPost("delete-all")]
        public async Task<IActionResult> DeleteAllOrganizations()
        {
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM [dbo].[Organization];");
            return NoContent();
        }
    }
}