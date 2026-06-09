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
          <Clock className="text-amber-500" />
          <span>Log de Auditoría de Seguridad</span>
        </h2>
        <p className="text-xs text-gray-400">Historial completo e inmutable de asignación y revocación de perfiles (RF 6.3).</p>
      </div>

      <div className="bg-gray-950/40 border border-gray-900 rounded-3xl overflow-hidden">
        <table className="w-full text-xs text-left text-gray-400 border-collapse">
          <thead className="bg-gray-950/60 text-white font-semibold border-b border-gray-800">
            <tr>
              <th className="p-4">Fecha y Hora</th>
              <th className="p-4">Usuario Destino</th>
              <th className="p-4">Perfil</th>
              <th className="p-4">Operación</th>
              <th className="p-4">Ejecutado Por</th>
              <th className="p-4">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900/60">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-900/10">
                <td className="p-4 font-mono text-[10px] text-gray-500">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="p-4 text-white font-medium">@{log.username}</td>
                <td className="p-4">
                  <span className="bg-amber-500/10 text-amber-500 text-[10px] font-semibold px-2 py-0.5 rounded">
                    {log.profile_name}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.action === "assign" 
                      ? "bg-green-500/10 text-green-400" 
                      : log.action === "revoke" || log.action === "auto_expire"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}>
                    {log.action === "assign" ? "Asignar" : log.action === "revoke" ? "Revocar" : log.action === "auto_expire" ? "Expiración" : "Suscripción"}
                  </span>
                </td>
                <td className="p-4 font-semibold text-white">@{log.performed_by_name}</td>
                <td className="p-4 text-[11px] max-w-xs truncate">{log.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
