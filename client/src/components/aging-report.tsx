import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AgingData {
  current: number;
  days30to60: number;
  days61to90: number;
  over90days: number;
}

export default function AgingReport() {
  const { data: agingData } = useQuery<AgingData>({
    queryKey: ["/api/accounts-receivable/aging"],
  });

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  if (!agingData) {
    return <div>Cargando reporte...</div>;
  }

  const total = agingData.current + agingData.days30to60 + agingData.days61to90 + agingData.over90days;
  
  const chartData = [
    { name: '0-30 días', amount: agingData.current, percentage: total > 0 ? (agingData.current / total) * 100 : 0 },
    { name: '31-60 días', amount: agingData.days30to60, percentage: total > 0 ? (agingData.days30to60 / total) * 100 : 0 },
    { name: '61-90 días', amount: agingData.days61to90, percentage: total > 0 ? (agingData.days61to90 / total) * 100 : 0 },
    { name: '+90 días', amount: agingData.over90days, percentage: total > 0 ? (agingData.over90days / total) * 100 : 0 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reporte de Antigüedad de Saldos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico */}
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), 'Monto']}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detalles */}
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">0-30 días (Corriente)</span>
                  <span className="font-medium text-green-600">{formatCurrency(agingData.current)}</span>
                </div>
                <Progress 
                  value={total > 0 ? (agingData.current / total) * 100 : 0} 
                  className="h-2 bg-green-100"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">31-60 días</span>
                  <span className="font-medium text-yellow-600">{formatCurrency(agingData.days30to60)}</span>
                </div>
                <Progress 
                  value={total > 0 ? (agingData.days30to60 / total) * 100 : 0} 
                  className="h-2 bg-yellow-100"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">61-90 días</span>
                  <span className="font-medium text-orange-600">{formatCurrency(agingData.days61to90)}</span>
                </div>
                <Progress 
                  value={total > 0 ? (agingData.days61to90 / total) * 100 : 0} 
                  className="h-2 bg-orange-100"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Más de 90 días</span>
                  <span className="font-medium text-red-600">{formatCurrency(agingData.over90days)}</span>
                </div>
                <Progress 
                  value={total > 0 ? (agingData.over90days / total) * 100 : 0} 
                  className="h-2 bg-red-100"
                />
              </div>

              <div className="border-t pt-3 mt-4">
                <div className="flex justify-between items-center font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}