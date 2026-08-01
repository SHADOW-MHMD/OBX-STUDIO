import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface DocumentNodeProps {
  data: { label: string };
}

export const DocumentNode: React.FC<DocumentNodeProps> = ({ data }) => {
  return (
    <div className="bg-[#121212]/90 backdrop-blur-md border border-[#333] p-4 rounded-xl shadow-2xl min-w-[150px] transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(100,200,255,0.4)] hover:border-[#64c8ff]">
      <Handle type="target" position={Position.Top} className="!bg-[#64c8ff]" />
      <div className="flex items-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span className="text-gray-100 font-medium text-sm">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-[#64c8ff]" />
    </div>
  );
};
