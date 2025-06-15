import React from 'react';

const PostDetailSkeleton = () => (
  <div className="border p-6 rounded shadow animate-pulse space-y-4">
    <div className="h-8 bg-gray-300 rounded w-2/3"></div>
    <div className="h-4 bg-gray-300 rounded w-full"></div>
    <div className="h-4 bg-gray-300 rounded w-5/6"></div>
    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    <div className="h-64 bg-gray-200 rounded w-full mt-6"></div>
  </div>
);

export default PostDetailSkeleton;
