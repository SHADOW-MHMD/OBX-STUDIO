import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface PersonaNodeProps {
  data: { label: string };
}

export const PersonaNode: React.FC<PersonaNodeProps> = ({ data }) => {
  return (
    <div className="bg-gradient-to-br from-[#1e1e1e] to-[#2a1e3a] border-2 border-purple-500/50 p-4 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.2)] min-w-[120px] h-[120px] flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:border-purple-400">
      <Handle type="target" position={Position.Top} className="!bg-purple-400" />
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-purple-400 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2"></rect>
        <circle cx="12" cy="5" r="2"></circle>
        <path d="M12 7v4"></path>
        <line x1="8" y1="16" x2="8" y2="16"></line>
        <line x1="16" y1="16" x2="16" y2="16"></line>
      </svg>
      <span className="text-purple-100 font-medium text-xs text-center">{data.label}</span>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-400" />
    </div>
  );
};
