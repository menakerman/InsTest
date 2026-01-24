import { useState } from 'react';
import { exportFinalReport } from '../utils/api';

function ExportReportButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      await exportFinalReport();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-button-container">
      <button
        className="btn btn-success"
        onClick={handleExport}
        disabled={loading}
      >
        {loading ? 'מייצר דוח...' : 'יצוא דוח סיכום'}
      </button>
      {error && <span className="export-error">{error}</span>}
    </div>
  );
}

export default ExportReportButton;
