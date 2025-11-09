
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Ethical IEEE Paper Generator
        </h1>
        <p className="text-sm text-gray-400">Your AI-powered research writing assistant for structure and clarity.</p>
      </div>
    </header>
  );
};

export default Header;
