import React from 'react';

const MediaTuitionCard = ({ tuition, loading }) => {
  if (loading) {
    return (
      <div className="card bg-white shadow-md rounded-xl p-6 animate-pulse mb-6">
        <div className="h-6 w-3/4 bg-gray-200 rounded skeleton mb-2" />
        <div className="h-4 w-1/2 bg-gray-200 rounded skeleton mb-2" />
        <div className="h-4 w-1/3 bg-gray-200 rounded skeleton mb-2" />
        <div className="h-10 w-24 bg-gray-200 rounded skeleton mt-4" />
      </div>
    );
  }

  return (
    <div className="card bg-white shadow-md hover:shadow-lg transition rounded-xl p-6 mb-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-primary">{tuition.title}</h2>
        <p><span className="font-medium">Class:</span> {tuition.class}</p>
        <p><span className="font-medium">Subject:</span> {tuition.subject}</p>
        <p><span className="font-medium">Days/Week:</span> {tuition.days}</p>
        <p><span className="font-medium">Salary:</span> ৳{tuition.salary}</p>
        <p><span className="font-medium">Code:</span> {tuition.code}</p>
        <p><span className="font-medium">Location:</span> {tuition.location}</p>
        <p><span className="font-medium">Mode:</span> {tuition.mode}</p>
        <p><span className="font-medium">Contact:</span> {tuition.contact}</p>
      </div>
      <div className="mt-4">
        <button className="btn btn-primary btn-sm rounded-full">Apply</button>
      </div>
    </div>
  );
};

export default MediaTuitionCard;
