import React, { useState, useEffect } from 'react';
import { FaHourglassHalf, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { MdOutlineFileDownload } from 'react-icons/md';
import axios from 'axios';  // Use import instead of require
import Pagination, { getPaginationData } from './Pagination';
import Loader from "../Assets/Loader";
import Empty from '../Assets/Empty.svg';
 
 
 
export default function LeaveApprovalDashboard() {
  const [Data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [count, setCount] = useState(0);
  const [statusCount, setStatusCount] = useState({pending: 0, approved: 0, rejected: 0,});
  const [isEditing, setIsEditing] = useState({}); //state to track editing
  //state varaiables for managing modal, rejection reason, and leave date
  const [showModal, setShowModal] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedStatus, setSelectedStatus] = useState('ALL');
   const [filteredRequests, setFilteredRequests] = useState([]);
    const [startDate, setStartDate] = useState(""); // Start date for filtering
    const [endDate, setEndDate] = useState(""); // End date for filtering
   
  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage] = useState(5);
  const managerId=localStorage.getItem("employeeId");
 
  // open modal and set selected leave ID
  const openRejectModal = (id) => {
    setSelectedLeaveId(id);
    setShowModal(true);
  };
 
  // close the modal reset reason
  const closeModal = () => {
    setShowModal(false);
    setRejectionReason("");
  };
 
 
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`http://localhost:8085/apis/employees/manager/${managerId}`, {
          method:'GET',
          headers:{
            'Authorization' : `Bearer ${token}`,
            'Content-Type' : 'application/json'
          },
        });
        const leaves = response.data;
        // Sort leaves with new entries at the top
        setData(leaves.sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id))); // Assuming 'createdAt' is available
        setFilteredData(leaves.sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id)));
        setFilteredRequests(leaves);
        const total = leaves.length;
        const pending = leaves.filter(leave => leave.leaveStatus === 'PENDING').length;
        const approved = leaves.filter(leave => leave.leaveStatus === 'APPROVED').length;
        const rejected = leaves.filter(leave => leave.leaveStatus === 'REJECTED').length;
 
        setCount(total);
        setStatusCount({ pending, approved, rejected });
      } catch (error) {
        console.error("Error fetching leave requests:", error);
      }
      finally{
        setLoading(false);
      }
    };
    fetchData();
  }, [managerId]);
 
  const handleApprove = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://localhost:8085/apis/employees/approve/${id}`, {
        method:'GET',
        headers:{
          'Authorization' : `Bearer ${token}`,
          'Content-Type' : 'application/json'
        },
      });
      const response = await axios.get(`http://localhost:8085/apis/employees/manager/${managerId}`, {
        method:'GET',
        headers:{
          'Authorization' : `Bearer ${token}`,
          'Content-Type' : 'application/json'
        },
      });
 
   
      const leaves = response.data;
      // Sort leaves with new entries at the top
      setData(leaves.sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id)));
      setFilteredData(leaves.sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id)));
      setFilteredRequests(leaves);
      setIsEditing({ ...isEditing, [id]: false }); //exit edit mode after approval
       // Update the status count directly
    setStatusCount((prevStatusCount) => ({
      ...prevStatusCount,
      approved: prevStatusCount.approved + 1,
      pending: Math.max(0, prevStatusCount.pending - 1), // Ensure pending does not go negative
    }));
    } catch (error) {
      console.error("Error approving leave request:", error);
    }
    finally{
      setLoading(false);
    }
  };
 
  // Handle rejection with backend integration
  const handleReject = async () => {
    setLoading(true);
    if (!rejectionReason) {
      alert("Please provide a rejection reason.");
      return;
    }
 
    try {
      console.log(rejectionReason);
      // Encode the rejectionReason to ensure proper handling of special characters
    //const encodedReason = encodeURIComponent(rejectionReason);
    const token = localStorage.getItem('token')
      await axios.put(`http://localhost:8085/apis/employees/reject/${selectedLeaveId}/${rejectionReason}`, {
        method:'GET',
        headers:{
          'Authorization' : `Bearer ${token}`,
          'Content-Type' : 'application/json'
        },
      });
      const response = await axios.get(`http://localhost:8085/apis/employees/manager/${managerId}`, {
        method:'GET',
        headers:{
          'Authorization' : `Bearer ${token}`,
          'Content-Type' : 'application/json'
        },
      });
     
 
      const leaves = response.data;
      // Sort leaves with new entries at the top
      setData(leaves.sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id)));
      setFilteredData(leaves.sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id)));
      setFilteredRequests(leaves);
      setRejectionReason(response.data)
      setIsEditing({ ...isEditing, [selectedLeaveId]: false }); // exit edit mode after rejection
       // Update the status count directly
    setStatusCount((prevStatusCount) => ({
      ...prevStatusCount,
      rejected: prevStatusCount.rejected + 1,
      pending: Math.max(0, prevStatusCount.pending - 1), // Ensure pending does not go negative
    }));
 
      // Optionally refresh data here (for instance, refetch the leave data)
      // Close modal after rejection
      closeModal();
    } catch (error) {
      console.error("Error rejecting leave request:", error);
    }
    finally{
      setLoading(false);
    }
  };
 
  // const filterByStatus = (status) => {
  //   console.log("data: " , Data)
  //    if (!Array.isArray(Data)) {
  //   console.error("Error: Data is not an array!", Data);
  //   return;
  // }
  //   if (status === 'ALL') {
  //     setFilteredData(Data);
  //   } else {
  //     const filtered = Data.filter(leave => leave.leaveStatus === status);
  //     setFilteredData(filtered);
  //   }
  //   setCurrentPage(1); // Reset to first page on filter change
  // };
 
  const toggleEdit = (id) => {
    // Toggle the editing state for the specific leave request ID
    setIsEditing((prevState) => ({
      ...prevState,
      [id]: !prevState[id], // This will flip the edit mode for the given leave
    }));
  };
 
  // Handle changes in date inputs
  const handleStartDateChange = (e) => {
    const value = e.target.value;
    console.log("Selected Start Date: ", value);
    setStartDate(value);
};
 
const handleEndDateChange = (e) => {
    const value = e.target.value;
    console.log("Selected End Date: ", value);
    setEndDate(value);
};
 
const handleSubmit = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      console.log("Filtering with Leave Start Date:", startDate);
      console.log("Filtering with Leave End Date:", endDate);
  } else {
      console.log("Please select both leave start and end dates.");
  }
 
};
 
  const applyFilters = () => {
    console.log("Leave Requests Data:", Data);
 
    let filtered = [...Data] // always start from original data
 
    console.log("Filtering with Start Date:", startDate);
    console.log("Filtering with End Date:", endDate);
 
    // Apply status filters
    if(selectedStatus !== 'ALL'){
      filtered = filtered.filter(request => request.leaveStatus === selectedStatus)
    }
 
   
    console.log("Data Dates:", filteredData.leaveStartDate, filtered.leaveEndDate);
 
  //   if (startDate) {
  //     filtered = filtered.filter(request => new Date(request.leaveStartDate) >= startDate);
  // }
 
  // if (endDate) {
  //     filtered = filtered.filter(request => new Date(request.leaveEndDate) <= endDate);
  // }
 
  //   setFilteredRequests(filtered.length > 0 ? filtered : []); // Always ensure its an array
 
  // // If no start date or end date is selected, show all leave requests
  // if (!startDate && !endDate) {
  //   setFilteredRequests(Data); // Show all requests
  //   return;
  // }
   
    // If a start date is selected, filter the leave requests that are >= start date
    if (startDate) {
      filtered = filtered.filter(request => new Date(request.leaveStartDate) >= new Date(startDate));
      setStartDate("");
    }
   
    // If an end date is selected, filter the leave requests that are <= end date
    if (endDate) {
      filtered = filtered.filter(request => new Date(request.leaveEndDate) <= new Date(endDate));
      setEndDate("")
    }
 
    setFilteredRequests(filtered);
   
   
  }
 
  // call applyFilters() whenever filter is changed
  const filterByStatus = (status) => {
    setSelectedStatus(status);
    applyFilters();
  }
 
  const filterByDateRange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    applyFilters();
   
   
  }
 
  // Get paginate data
  const {totalPages, currentItems} = getPaginationData(filteredRequests ?? [],currentPage, employeesPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
 
  const headers = ["Employee", "Employee ID", "Start Date", "End Date","Leave Type", "Days", "Status", "Action"];
  const renderRowData = (data) => {
    const rowData = [
      { key: "firstName", value: data.firstName },
      { key: "employeeId", value: data.employeeId },
      { key: "leaveStartDate", value: data.leaveStartDate },
      { key: "leaveEndDate", value: data.leaveEndDate },
      {key: "leaveType", value: data.leaveType},
      { key: "duration", value: data.duration },
    ];
 
    return rowData.map((item) => (
      <div key={item.key} className="p-2 text-lg">
        {item.value}
      </div>
    ));
  };
 
  //  // Filter the leave requests based on the selected start and end dates
  //  const filterByDateRange = () => {
  //   let filtered = [...Data];
  //   // If no start date or end date is selected, show all leave requests
  // if (!startDate && !endDate) {
  //   setFilteredRequests(Data); // Show all requests
  //   return;
  // }
   
  //   // If a start date is selected, filter the leave requests that are >= start date
  //   if (startDate) {
  //     filtered = filtered.filter(request => new Date(request.leaveStartDate) >= new Date(startDate));
  //   }
   
  //   // If an end date is selected, filter the leave requests that are <= end date
  //   if (endDate) {
  //     filtered = filtered.filter(request => new Date(request.leaveEndDate) <= new Date(endDate));
  //   }
 
  //   setFilteredRequests(filtered);
  // };
 
  const getStatusClass = (status) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600";
      case "PENDING":
        return "text-yellow-600";
      case "REJECTED":
        return "text-red-600";
      default:
        return "";
    }
  };
 
  const getStatusIcon = (status) => {
    switch (status) {
      case "APPROVED":
        return <FaCheckCircle />;
      case "PENDING":
        return <FaHourglassHalf />;
      case "REJECTED":
        return <FaTimesCircle />;
      default:
        return null;
    }
  };
 
  const renderActions = (data) => {
    // Check if the request is being edited (edit mode is toggled)
    if (isEditing[data.id]) {
      if (data.leaveStatus === "APPROVED") {
        // If the status is "APPROVED", show "Reject" and "Download" buttons when editing
        return (
          <div className="flex items-center space-x-2">
            <button
              className="text-red-500 hover:text-red-500 border border-red-400 px-3 py-2 whitespace-nowrap text-lg font-medium rounded"
              onClick={() => openRejectModal(data.id)} // Open the rejection modal
            >
              Reject
            </button>
            {data.medicalDocument && (
              <AttachmentItem
                key={data.employeeId}
                filename="medical Document"
                fileUrl={data.medicalDocument}
                icon={<MdOutlineFileDownload className="h-6 w-6 text-gray-400" />}
              />
            )}
          </div>
        );
      }
     
      if (data.leaveStatus === "REJECTED") {
        // If the status is "REJECTED", show "Approve" and "Download" buttons when editing
        return (
          <div className="flex items-center space-x-2">
            <button
              className="text-green-600 hover:text-green-500 border border-green-800 px-3 py-2 whitespace-nowrap text-lg font-medium rounded"
              onClick={() => handleApprove(data.id)} // Approve the request
            >
              Approve
            </button>
            {data.medicalDocument && (
              <AttachmentItem
                key={data.employeeId}
                filename="medical Document"
                fileUrl={data.medicalDocument}
                icon={<MdOutlineFileDownload className="h-6 w-6 text-gray-400" />}
              />
            )}
          </div>
        );
      }
    }
 
    // Default actions for when the request is not in edit mode
    if (data.leaveStatus === "PENDING") {
      return (
        <div className="flex items-center space-x-2">
          <button
            className="text-green-500 hover:text-green-500 border border-green-400 px-3 py-2 whitespace-nowrap text-lg font-medium rounded"
            onClick={() => handleApprove(data.id)} // Approve the request
          >
            Approve
          </button>
          <button
            className="text-red-500 hover:text-red-500 border border-red-400 px-3 py-2 whitespace-nowrap text-lg font-medium rounded"
            onClick={() => openRejectModal(data.id)} // Open the rejection modal
          >
            Reject
          </button>
          {data.medicalDocument && (
            <AttachmentItem
              key={data.employeeId}
              filename="medical Document"
              fileUrl={data.medicalDocument}
              icon={<MdOutlineFileDownload className="h-6 w-6 text-gray-400" />}
            />
          )}
        </div>
      );
    }
 
    // If the status is APPROVED or REJECTED, show the Edit button and download button
    return (
      <div className="flex items-center space-x-2">
        <button
          className="text-blue-500 hover:text-blue-900 border border-blue-500 px-3 py-2 whitespace-nowrap text-lg font-medium rounded"
          onClick={() => toggleEdit(data.id)} // Toggle edit mode
        >
          Edit
        </button>
        {data.medicalDocument && (
          <AttachmentItem
            key={data.employeeId}
            filename="medical Document"
            fileUrl={data.medicalDocument}
            icon={<MdOutlineFileDownload className="h-6 w-6 text-gray-400" />}
          />
        )}
      </div>
    );
  };
 
 
  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h1 className="text-2xl font-extrabold text-center ml-4">RECEIVED LEAVE REQUESTS</h1>
        <div className="flex items-center space-x-4">
                   
                    {/* Calendar for selecting start and end dates */}
                    <div>
            <form onSubmit={handleSubmit}>
                <div className="flex items-center space-x-2">
                    <input
                        type="date"
                        value={filteredData.leaveStartDate}  // Convert to yyyy-MM-dd
                         onChange={handleStartDateChange}
                        placeholder="Select start date"
                        className="p-3 border rounded-md text-md"
                    />
                    <span>to</span>
                    <input
                        type="date"
                       value={filteredData.leaveEndDate}  // Convert to yyyy-MM-dd
                       onChange={handleEndDateChange}
                        placeholder="Select end date"
                        className="p-3 border rounded-md"
                    />
                    <button
                        onClick={filterByDateRange}
                        className="ml-2 px-4 py-2 bg-blue-600 text-white text-lg rounded"
                      >
                        Filter
                      </button>
                </div>
               
            </form>
        </div>
                   
                    {/* Filter and Show All buttons */}
                    <div className="flex space-x-2">
                     
                      <button
                        onClick={() => {
                          setStartDate(null);
                          setEndDate(null);
                          setFilteredRequests(Data); // Reset to show all requests
                           setCurrentPage(1); // Reset pagination to the first page
                        }}
                        className="ml-2 px-4 py-2 bg-gray-600 text-white text-lg rounded"
                      >
                        Show All
                      </button>
                    </div>
                  </div>
                  </div>
     
      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
        <div className="text-center text-sm font-bold p-2">
          <button className="bg-blue-100 hover:bg-blue-200 text-gray-700 p-4 rounded-lg text-xl shadow-md cursor-pointer transition duration-300 ease-in-out" onClick={() => filterByStatus('ALL')}>Total Requests : {count}</button>
        </div>
        <div className="text-center text-sm font-bold p-2">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-4 rounded-lg text-xl shadow-md cursor-pointer transition duration-300 ease-in-out" onClick={() => filterByStatus('PENDING')}>Pending : {statusCount.pending}</button>
        </div>
        <div className="text-center text-sm font-bold p-2">
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-4 rounded-lg text-xl shadow-md cursor-pointer transition duration-300 ease-in-out" onClick={() => filterByStatus('APPROVED')}>Approved : {statusCount.approved}</button>
        </div>
        <div className="text-center text-sm font-bold p-2">
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-700 p-4 rounded-lg text-xl shadow-md cursor-pointer transition duration-300 ease-in-out" onClick={() => filterByStatus('REJECTED')}>Rejected : {statusCount.rejected}</button>
        </div>
      </div>
 
      {/* Leave Requests Table */}
      {loading ? <Loader/>: filteredData.length===0 ? <img className='mt-40 ml-auto mr-auto h-80 self-center ' src={Empty} alt="No Data FOund"/> :
      (<div className="overflow-x-auto">
        <div className="grid grid-cols-1 sm:grid-cols-8 bg-gray-100">
          <div className="col-span-8 text-center text-md font-bold p-2 bg-gray-200">LEAVE REQUESTS</div>
 
          {/* Table Header */}
          {headers.map((header) => (
    <div key={header} className="p-2 border-b border-gray-300 text-center text-md font-bold">
      {header}
    </div>
  ))}
        </div>
 
        {/* Table Body */}
{filteredData && currentItems.map((data) => (
  <div
    key={data.id}
    className="grid grid-cols-1 sm:grid-cols-8 text-center p-2 border-b border-gray-200 items-center bg-gray-100"
  >
    {/* Render Row Data */}
    {renderRowData(data)}
 
    {/* Render Status */}
    <div
      className={`p-2 text-lg flex items-center justify-center space-x-1 ${
        getStatusClass(data.leaveStatus)
      }`}
    >
      {getStatusIcon(data.leaveStatus)}
      {data.leaveStatus}
    </div>
 
    {/* Render Actions */}
    <div className="p-2 flex justify-center space-x-2">
      {renderActions(data)}
    </div>
    </div>
))}
 
 
     {/* Pagination controls */}
     <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        paginate={paginate}
       
      />
 
 
   </div>
      )
    }
     
      {/* Rejection Reason Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-75">
          <div className="bg-white p-4 rounded-md shadow-md w-11/12 sm:w-1/3">
            <h2 className="text-xl font-bold mb-4">Reject Leave Request</h2>
            <textarea
              name='leaveReason'
              className="w-full p-2 border border-gray-300 rounded bg-gray-100 dark:bg-gray-700 text-white"
              rows="4"
              placeholder="Enter rejection reason..."
              value={rejectionReason.leaveReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end space-x-2 mt-4">
              <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded" onClick={closeModal}>Cancel</button>
              <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleReject}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 
function AttachmentItem({ filename, icon, fileUrl }) {
  const handleDownload = () => {
      if (!fileUrl) {
          console.error("File URL is invalid");
          return;
      }
      // filename="medical_document.pdf"
 
 
      console.log("Downloading file:", fileUrl, filename);
      const link = document.createElement("a");
      link.href = fileUrl;
      link.setAttribute("download", filename); // Set download filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
 
  return (
              <button variant="outline" size="lg" onClick={handleDownload}>
                  {icon}
              </button>
  );
}