import React from 'react';

const PostSkeleton = () => (
  <div className="border p-4 rounded shadow animate-pulse space-y-3">
    <div className="h-6 bg-gray-300 rounded w-3/4"></div>
    <div className="h-4 bg-gray-300 rounded w-full"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
  </div>
);

export default PostSkeleton;
