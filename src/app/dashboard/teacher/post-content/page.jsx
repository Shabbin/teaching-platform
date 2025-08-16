'use client';

import React from 'react';
import CreatePostWizard from '../components/formComponents/CreatePostWizard';
import Link from 'next/link';

const PostContentPage = () => {
  return (
    <div className="w-full p-4 space-y-6">
      {/* Wizard to create new post */}
      <CreatePostWizard />

      {/* Button to navigate to posts list */}
      {/* <div className="mt-8">
        <Link
          href="/dashboard/myposts"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Manage My Posts
        </Link>
      </div> */}
    </div>
  );
};

export default PostContentPage;
