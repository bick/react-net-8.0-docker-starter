namespace StarterAPI.Models
{
    public class Organization
    {
        public int ID {  get; set; }
        public string EIN { get; set; }
        public string OrgName { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Country { get; set; }
        public string Status { get; set; }
    }
}
