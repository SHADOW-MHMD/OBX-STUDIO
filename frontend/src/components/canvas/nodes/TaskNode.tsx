import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface TaskNodeProps {
  data: { label: string; status?: string; assigneeInitial?: string };
}

export const TaskNode: React.FC<TaskNodeProps> = ({ data }) => {
  return (
    <div className="bg-[#1a1c23] border border-[#444] p-4 rounded-xl shadow-lg min-w-[200px] transition-all duration-300 hover:shadow-[0_0_15px_rgba(100,255,150,0.2)] hover:border-[#64ff96]">
      <Handle type="target" position={Position.Top} className="!bg-[#64ff96]" />
      <div className="flex flex-col gap-2">
        <div className="text-gray-100 font-semibold text-sm">{data.label}</div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs px-2 py-1 bg-[#2a2d36] text-gray-300 rounded-md">
            {data.status || 'To Do'}
          </span>
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs text-white font-bold">
            {data.assigneeInitial || 'U'}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-[#64ff96]" />
    </div>
  );
};
