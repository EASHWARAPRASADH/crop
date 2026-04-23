import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, ShieldCheck, User, Building, Phone, Mail, Hash, AlertTriangle } from 'lucide-react';

interface ScannedData {
  name?: string;
  class?: string;
  department?: string;
  phone?: string;
  email?: string;
  id?: string;
  imageId?: string;
  [key: string]: any;
}

const Verify = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<ScannedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const encodedData = searchParams.get('data');
      if (!encodedData) throw new Error('No data found in scan.');
      
      const decodedPayload = atob(encodedData);
      const parsed = JSON.parse(decodedPayload);
      setData(parsed);
      setError(null);
    } catch (err) {
      console.error('Failed to parse QR data:', err);
      setError('Invalid or corrupted QR Code data.');
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Scan Failed</h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Extract common fields dynamically, prioritizing known keys
  const getField = (keys: string[]) => {
    for (const key of keys) {
      const foundKey = Object.keys(data).find(k => k.toLowerCase() === key.toLowerCase() || k.toLowerCase().includes(key.toLowerCase()));
      if (foundKey && data[foundKey] && data[foundKey] !== '-') return String(data[foundKey]);
    }
    return '';
  };

  const name = getField(['name', 'student name', 'employee name', 'full name', 'first name']);
  const roleOrClass = getField(['class', 'grade', 'role', 'designation', 'position']);
  const department = getField(['department', 'dept', 'branch', 'section']);
  const phone = getField(['phone', 'mobile', 'contact']);
  const email = getField(['email', 'mail']);
  const recordId = getField(['id', 'roll', 'reg', 'enrollment']) || data.imageId;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {/* Top Branding Header */}
      <div className="w-full max-w-sm flex items-center justify-center mb-6">
        <ShieldCheck className="w-6 h-6 text-blue-600 mr-2" />
        <h1 className="text-gray-800 font-bold uppercase tracking-wider text-sm">Verified ID Record</h1>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm relative">
        {/* Banner */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 h-32 relative"></div>

        {/* Profile Avatar */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2">
          <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-xl">
            <div className="w-full h-full bg-blue-50 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-blue-200 text-blue-400">
              <User className="w-12 h-12 mb-1" />
              {data.imageId && data.imageId !== '-' ? (
                <span className="text-[10px] uppercase font-bold tracking-wider">IMG: {data.imageId}</span>
              ) : (
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">No Photo</span>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="px-6 pt-16 pb-8 text-center mt-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{name || 'Unknown User'}</h2>
          {(roleOrClass || department) && (
            <p className="text-sm font-medium text-blue-600 bg-blue-50 py-1.5 px-3 rounded-full inline-block mx-auto mb-6">
              {[roleOrClass, department].filter(Boolean).join(' • ')}
            </p>
          )}

          <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3 shadow-inner border border-gray-100">
            {recordId && (
              <div className="flex items-center text-sm">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 shrink-0">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Record ID</p>
                  <p className="font-semibold text-gray-800">{recordId}</p>
                </div>
              </div>
            )}
            
            {phone && (
              <div className="flex items-center text-sm">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Phone</p>
                  <p className="font-semibold text-gray-800">{phone}</p>
                </div>
              </div>
            )}

            {email && (
              <div className="flex items-center text-sm">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Email</p>
                  <p className="font-semibold text-gray-800 truncate max-w-[200px]">{email}</p>
                </div>
              </div>
            )}
            
            {/* Any other miscellaneous fields */}
            {Object.entries(data).filter(([k, v]) => 
              v && 
              v !== '-' && 
              !['name', 'class', 'department', 'phone', 'email', 'id', 'imageid'].some(x => k.toLowerCase().includes(x))
            ).map(([key, val]) => (
              <div key={key} className="flex items-center text-sm border-t border-gray-100 pt-3 mt-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mr-3 shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">{key}</p>
                  <p className="font-semibold text-gray-800">{String(val)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer status */}
        <div className="bg-green-50 px-4 py-3 border-t border-green-100 flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
          <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Valid Profile Scan</span>
        </div>
      </div>
      
      <p className="text-[10px] text-gray-400 mt-6 text-center max-w-xs">
        * Displaying preview data. Full photo will be visible once uploaded to the database.
      </p>
    </div>
  );
};

export default Verify;
