import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getLogsAction, deleteLogsAction } from "../../redux/actions/adminActions";
import dayjs from "dayjs";
import { FaSearch, FaSortUp, FaSortDown, FaSync, FaTrashAlt, FaInfoCircle } from "react-icons/fa";
import debounce from 'lodash.debounce';

// Component con cho việc phân trang
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center space-x-1 mt-6">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors">
        Prev
      </button>
      <span className="px-4 py-2 text-gray-600">
        Page {currentPage} of {totalPages}
      </span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors">
        Next
      </button>
    </div>
  );
};

// Component con hiển thị thời gian
const CurrentTime = () => {
  const [time, setTime] = useState(dayjs());
  useEffect(() => {
    const timer = setInterval(() => setTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <div className="text-sm text-gray-500 font-mono">{time.format("dddd, MMMM D, YYYY h:mm:ss A")}</div>;
};


const Logs = () => {
  const dispatch = useDispatch();
  // Lấy state đã được nâng cấp từ Redux
  const { logs, currentPage, totalPages, totalLogs, loadingLogs, adminPanelError } = useSelector((state) => state.admin);
  
  // State cục bộ để quản lý các bộ lọc và sắp xếp
  const [filters, setFilters] = useState({ level: '', type: '', search: '' });
  const [sort, setSort] = useState({ sortBy: 'timestamp', sortOrder: 'desc' });
  const [isLoading, setIsLoading] = useState(true);

  // Hàm gọi API, được bọc trong useCallback để tối ưu hóa
  const fetchLogs = useCallback((page) => {
    setIsLoading(true);
    const queryParams = { page, ...filters, ...sort };
    dispatch(getLogsAction(queryParams)).finally(() => setIsLoading(false));
  }, [dispatch, filters, sort]);

  // Sử dụng debounce để trì hoãn việc gọi API khi người dùng nhập liệu
  const debouncedFetch = useCallback(debounce((page) => fetchLogs(page), 500), [fetchLogs]);

  // useEffect để gọi API khi bộ lọc hoặc sắp xếp thay đổi
  useEffect(() => {
    debouncedFetch(1); // Luôn fetch trang 1 khi filter/sort thay đổi
  }, [filters, sort, debouncedFetch]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSort = (field) => {
    const newSortOrder = sort.sortBy === field && sort.sortOrder === 'desc' ? 'asc' : 'desc';
    setSort({ sortBy: field, sortOrder: newSortOrder });
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      fetchLogs(page);
    }
  };
  
  const handleCleanup = () => {
    if (window.confirm("Are you sure you want to clear ALL logs? This action cannot be undone.")) {
      dispatch(deleteLogsAction());
    }
  };

  const renderSortIcon = (field) => {
    if (sort.sortBy !== field) return <FaSortUp className="inline ml-2 text-gray-300" />;
    return sort.sortOrder === 'desc' ? <FaSortDown className="inline ml-2 text-blue-500" /> : <FaSortUp className="inline ml-2 text-blue-500" />;
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">User Activity Logs</h1>
          <p className="text-gray-500 mt-1">Monitor all system and user activities.</p>
        </div>
        <div className="mt-2 sm:mt-0 w-full sm:w-auto"><CurrentTime /></div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative col-span-1 md:col-span-2">
            <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input type="text" name="search" placeholder="Search by message, email, IP..." onChange={handleFilterChange} className="pl-10 p-2 border rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"/>
          </div>
          <div>
            <select name="level" onChange={handleFilterChange} className="p-2 border rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
              <option value="">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div>
            <select name="type" onChange={handleFilterChange} className="p-2 border rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
              <option value="">All Types</option>
              <option value="sign in">Sign In</option>
              <option value="login fail">Login Fail</option>
              <option value="logout">Logout</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div className="text-sm text-gray-600 mb-2 sm:mb-0">
            Showing <span className="font-semibold">{logs?.length || 0}</span> of <span className="font-semibold">{totalLogs || 0}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => fetchLogs(currentPage)} className="flex items-center px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300 transition">
              <FaSync className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={handleCleanup} disabled={isLoading} className="flex items-center px-4 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition disabled:opacity-50">
              <FaTrashAlt className="mr-2" /> Clear Logs
            </button>
          </div>
        </div>
        
        {isLoading && (!logs || logs.length === 0) ? <div className="text-center p-10">Loading...</div> : 
         adminPanelError ? <div className="text-center p-10 text-red-500">{adminPanelError}</div> :
         !logs || logs.length === 0 ? (
          <div className="text-gray-500 text-lg text-center p-10">No logs found for the current filters.</div>
         ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-800 uppercase bg-gray-100">
                  <tr>
                    <th onClick={() => handleSort('timestamp')} className="px-6 py-3 cursor-pointer">Timestamp {renderSortIcon('timestamp')}</th>
                    <th className="px-6 py-3">Level</th>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Message</th>
                    <th className="px-6 py-3 text-center">Context</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-xs">
                         <div title={log.formattedTimestamp}>{log.relativeTimestamp}</div>
                         <div className="text-gray-400">{log.formattedTimestamp.split(',')[1]}</div>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          log.level === "error" ? "bg-red-100 text-red-800" : log.level === "warn" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"
                        }`}>{log.level}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{log.user ? log.user.name : (log.email || 'System')}</td>
                      <td className="px-6 py-4 max-w-sm"><p className="font-semibold capitalize truncate">{log.type}: <span className="font-normal">{log.message}</span></p></td>
                      <td className="px-6 py-4 text-center">
                        {log.context && log.context.ipAddress && (
                          <div className="relative group flex justify-center">
                            <FaInfoCircle className="text-gray-400 cursor-pointer" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                              {Object.entries(log.context).map(([key, value]) => value && (
                                <div key={key} className="truncate"><strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {String(value)}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </div>
    </div>
  );
};

export default Logs;