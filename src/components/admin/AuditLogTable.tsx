import React from "react";
import { Clock } from "lucide-react";

interface AuditLog {
  id: number;
  timestamp: string;
  username: string;
  profile_name: string;
  action: string;
  performed_by_name: string;
  notes: string;
}

interface AuditLogTableProps {
  auditLogs: AuditLog[];
}

export default function AuditLogTable({ auditLogs }: AuditLogTableProps) {
  return (
    <div className="flex-grow flex flex-col gap-6 text-left">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Clock className="text-[#E8612D]" />
          <span>Log de Auditoría de Seguridad</span>
        </h2>
        <p className="text-xs text-[#6b7280]">Historial completo e inmutable de asignación y revocación de perfiles (RF 6.3).</p>
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-xs text-left text-[#6b7280] border-collapse">
          <thead className="bg-gray-50 text-[#1a1a2e] font-semibold border-b border-[#e5e7eb]">
            <tr>
              <th className="px-2 py-3 sm:px-4">Fecha y Hora</th>
              <th className="px-2 py-3 sm:px-4">Usuario Destino</th>
              <th className="px-2 py-3 sm:px-4">Perfil</th>
              <th className="px-2 py-3 sm:px-4">Operación</th>
              <th className="px-2 py-3 sm:px-4">Ejecutado Por</th>
              <th className="px-2 py-3 sm:px-4">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-2 py-3 sm:px-4 font-mono text-[10px] text-gray-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-2 py-3 sm:px-4 text-[#1a1a2e] font-medium whitespace-nowrap">@{log.username}</td>
                <td className="px-2 py-3 sm:px-4">
                  <span className="bg-[#fff7ed] text-[#E8612D] text-[10px] font-semibold px-2 py-0.5 rounded whitespace-nowrap">
                    {log.profile_name}
                  </span>
                </td>
                <td className="px-2 py-3 sm:px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                    log.action === "assign"
                      ? "bg-green-500/10 text-green-400"
                      : log.action === "revoke" || log.action === "auto_expire"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}>
                    {log.action === "assign" ? "Asignar" : log.action === "revoke" ? "Revocar" : log.action === "auto_expire" ? "Expiración" : "Suscripción"}
                  </span>
                </td>
                <td className="px-2 py-3 sm:px-4 font-semibold text-[#1a1a2e] whitespace-nowrap">@{log.performed_by_name}</td>
                <td className="px-2 py-3 sm:px-4 text-[11px] max-w-[150px] sm:max-w-xs truncate">{log.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
