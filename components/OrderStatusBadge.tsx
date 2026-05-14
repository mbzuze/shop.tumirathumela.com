import React from "react";

interface OrderStatusBadgeProps {
  status: string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config: Record<string, { label: string; color: string }> = {
    pending: { label: "Payment Pending", color: "bg-yellow-100 text-yellow-800" },
    paid: { label: "Paid", color: "bg-green-100 text-green-800" },
    completed: { label: "Completed", color: "bg-blue-100 text-blue-800" },
    processing: { label: "Processing", color: "bg-blue-100 text-blue-800" },
    shipped: { label: "Shipped", color: "bg-purple-100 text-purple-800" },
    delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  };
  
  const { label, color } = config[status?.toLowerCase()] || { 
    label: status || "Unknown", 
    color: "bg-gray-100 text-gray-800" 
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${color}`}>
      {label}
    </span>
  );
}
