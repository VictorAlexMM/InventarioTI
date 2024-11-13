import React from 'react';

const Container = ({ children }) => {
  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
};

export default Container;
