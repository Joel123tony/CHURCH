import { useState, useEffect } from "react";
import { 
  HeartHandshake, 
  IndianRupee, 
  CalendarDays, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Inbox
} from "lucide-react";
import API from "../../api/axios";
import { toast } from "react-toastify";
import DonationDetailsModal from "./DonationDetailsModal";

export default function Donations() {
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({
    totalDonations: 0,
    todayDonations: 0,
    monthDonations: 0,
    successCount: 0,
    failedCount: 0,
    totalTransactions: 0
  });
  
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal
  const [selectedDonation, setSelectedDonation] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, sortBy, startDate, endDate, minAmount, maxAmount]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [donationsRes, statsRes] = await Promise.all([
        API.get("/donations"),
        API.get("/donations/stats")
      ]);
      
      setDonations(donationsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch donation data.");
    } finally {
      setLoading(false);
    }
  };

  const filteredDonations = donations
    .filter(d => {
      // 1. Search
      const s = search.toLowerCase();
      const matchSearch = 
        (d.name?.toLowerCase().includes(s)) || 
        (d.email?.toLowerCase().includes(s)) ||
        (d.phone?.toLowerCase().includes(s)) ||
        (d.razorpayPaymentId?.toLowerCase().includes(s)) ||
        (d.razorpayOrderId?.toLowerCase().includes(s));
        
      // 2. Status
      const matchStatus = filterStatus === "all" || d.paymentStatus.toLowerCase() === filterStatus;
      
      // 3. Date Range
      let matchDate = true;
      const txDate = new Date(d.transactionDate);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) matchDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) matchDate = false;
      }

      // 4. Amount Range
      let matchAmount = true;
      if (minAmount && d.amount < Number(minAmount)) matchAmount = false;
      if (maxAmount && d.amount > Number(maxAmount)) matchAmount = false;

      return matchSearch && matchStatus && matchDate && matchAmount;
    })
    .sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.transactionDate) - new Date(a.transactionDate);
      if (sortBy === "date_asc") return new Date(a.transactionDate) - new Date(b.transactionDate);
      if (sortBy === "amount_desc") return b.amount - a.amount;
      if (sortBy === "amount_asc") return a.amount - b.amount;
      return 0;
    });

  // Pagination Logic
  const totalPages = Math.ceil(filteredDonations.length / rowsPerPage);
  const paginatedDonations = filteredDonations.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleExport = () => {
    if (filteredDonations.length === 0) {
      toast.info("No data to export based on current filters.");
      return;
    }
    
    const headers = ["Name", "Email", "Phone", "Amount", "Currency", "Status", "Date", "Razorpay Payment ID", "Razorpay Order ID"];
    const csvContent = [
      headers.join(","),
      ...filteredDonations.map(d => [
        `"${d.name || 'Anonymous'}"`,
        `"${d.email || ''}"`,
        `"${d.phone || ''}"`,
        d.amount,
        d.currency || 'INR',
        d.paymentStatus,
        new Date(d.transactionDate).toLocaleString(),
        `"${d.razorpayPaymentId || ''}"`,
        `"${d.razorpayOrderId || ''}"`
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Donations_Export_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, isMoney = false }) => (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-[#531B24]">
            {isMoney ? `₹${value.toLocaleString()}` : value}
          </h3>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const isSuccess = status === 'Successful';
    const isFailed = status === 'Failed';
    
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isSuccess ? 'bg-green-100 text-green-700' :
        isFailed ? 'bg-red-100 text-red-700' :
        'bg-orange-100 text-orange-700'
      }`}>
        {isSuccess && <CheckCircle2 className="h-3 w-3" />}
        {isFailed && <XCircle className="h-3 w-3" />}
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#531B24]">Donations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage online donations, track payments, and view statistics.
          </p>
        </div>
        
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Raised" 
          value={stats.totalDonations} 
          icon={IndianRupee} 
          colorClass="bg-[#F4EFE7] text-[#531B24]"
          isMoney
        />
        <StatCard 
          title="This Month" 
          value={stats.monthDonations} 
          icon={CalendarDays} 
          colorClass="bg-[#F4EFE7] text-[#531B24]"
          isMoney
        />
        <StatCard 
          title="Today" 
          value={stats.todayDonations} 
          icon={HeartHandshake} 
          colorClass="bg-[#F4EFE7] text-[#531B24]"
          isMoney
        />
        <StatCard 
          title="Total Transactions" 
          value={stats.totalTransactions} 
          icon={CheckCircle2} 
          colorClass="bg-[#F4EFE7] text-[#531B24]"
        />
      </div>

      {/* Main Content Area */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        
        {/* Advanced Filters */}
        <div className="border-b border-slate-200 p-4 bg-slate-50/50 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, email, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#531B24] focus:ring-1 focus:ring-[#531B24]"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm outline-none transition-all focus:border-[#531B24]"
              >
                <option value="all">All Statuses</option>
                <option value="successful">Successful</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-4 text-sm outline-none transition-all focus:border-[#531B24]"
            >
              <option value="date_desc">Latest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>

          {/* Additional Filters (Dates & Amounts) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-4 text-sm outline-none transition-all focus:border-[#531B24]"
              title="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-4 text-sm outline-none transition-all focus:border-[#531B24]"
              title="End Date"
            />
            <input
              type="number"
              placeholder="Min Amount (₹)"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-4 text-sm outline-none transition-all focus:border-[#531B24]"
            />
            <input
              type="number"
              placeholder="Max Amount (₹)"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 px-4 text-sm outline-none transition-all focus:border-[#531B24]"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-[#531B24]" />
            <p>Loading donations...</p>
          </div>
        ) : filteredDonations.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 mb-4">
              <Inbox className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No donations found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your filters or search query to find what you're looking for.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Donor</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedDonations.map((donation) => (
                    <tr key={donation._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{donation.name || "Anonymous"}</p>
                        {donation.email && <p className="text-xs text-slate-500 mt-0.5">{donation.email}</p>}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        ₹{donation.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={donation.paymentStatus} />
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(donation.transactionDate).toLocaleDateString()} <br/>
                        <span className="text-xs">{new Date(donation.transactionDate).toLocaleTimeString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedDonation(donation)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Hidden on tablet/desktop) */}
            <div className="md:hidden divide-y divide-slate-200">
              {paginatedDonations.map((donation) => (
                <div 
                  key={donation._id} 
                  className="p-4 bg-white active:bg-slate-50"
                  onClick={() => setSelectedDonation(donation)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-slate-800 text-base">{donation.name || "Anonymous"}</p>
                      <p className="text-xs text-slate-500">{new Date(donation.transactionDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800 text-base">₹{donation.amount.toLocaleString()}</p>
                      <div className="mt-1">
                        <StatusBadge status={donation.paymentStatus} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col gap-4 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Showing</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>of {filteredDonations.length} records</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-slate-700">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedDonation && (
        <DonationDetailsModal
          donation={selectedDonation}
          isOpen={!!selectedDonation}
          onClose={() => setSelectedDonation(null)}
        />
      )}
    </div>
  );
}
