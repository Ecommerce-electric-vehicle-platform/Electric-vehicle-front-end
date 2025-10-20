import React, { useEffect, useState } from "react";
import { getPendingSellers, approveSeller } from "../api/adminApi";

export default function AdminPendingSellers() {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async (page = 0, size = 10) => {
    setLoading(true);
    try {
      const data = await getPendingSellers({ page, size });
      setList(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDecision = async (sellerId, decision) => {
    await approveSeller({ sellerId, decision });
    await load();
  };

  if (loading) return <div>Loading...</div>;
  if (!list) return null;

  return (
    <div>
      {list.sellers.map((s) => (
        <div
          key={s.sellerId}
          style={{ border: "1px solid #eee", marginBottom: 12, padding: 12 }}
        >
          <div>
            <b>{s.storeName}</b> — {s.taxNumber}
          </div>
          <div>Trạng thái: {s.status}</div>
          <div
            style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}
          >
            {s.identityFrontImageUrl && (
              <img src={s.identityFrontImageUrl} alt="Front" width={120} />
            )}
            {s.identityBackImageUrl && (
              <img src={s.identityBackImageUrl} alt="Back" width={120} />
            )}
            {s.businessLicenseUrl && (
              <img src={s.businessLicenseUrl} alt="License" width={120} />
            )}
            {s.selfieUrl && <img src={s.selfieUrl} alt="Selfie" width={120} />}
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => onDecision(s.sellerId, "OK")}>Duyệt</button>
            <button
              onClick={() => onDecision(s.sellerId, "REJECTED")}
              style={{ marginLeft: 8 }}
            >
              Từ chối
            </button>
          </div>
        </div>
      ))}
      <div>
        Trang {list.currentPage + 1}/{list.totalPage}
      </div>
    </div>
  );
}
