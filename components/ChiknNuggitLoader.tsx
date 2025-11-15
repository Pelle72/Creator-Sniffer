import React from 'react';

export const ChiknNuggitLoader: React.FC = () => {
  return (
    <>
      <style>{`
        .bouncy-1 { animation: bounce 1.2s infinite 0s; }
        .bouncy-2 { animation: bounce 1.2s infinite 0.2s; }
        .bouncy-3 { animation: bounce 1.2s infinite 0.4s; }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-20px);
          }
          60% {
            transform: translateY(-10px);
          }
        }
        .ear {
            content: '';
            position: absolute;
            width: 12px;
            height: 20px;
            background-color: inherit;
            border-radius: 50%;
            top: -10px;
        }
      `}</style>
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="flex items-end justify-center space-x-2 h-20">
          {/* Chikn */}
          <div className="relative w-12 h-16 bg-yellow-400 rounded-t-full rounded-b-lg bouncy-1">
             <div className="ear" style={{ left: '8px', transform: 'rotate(-30deg)' }}></div>
             <div className="ear" style={{ right: '8px', transform: 'rotate(30deg)' }}></div>
          </div>
          {/* Cheezborger */}
          <div className="relative w-14 h-12 bg-red-500 rounded-t-full rounded-b-lg bouncy-2">
            <div className="ear" style={{ left: '10px', transform: 'rotate(-30deg)', width: '14px', height: '22px' }}></div>
            <div className="ear" style={{ right: '10px', transform: 'rotate(30deg)', width: '14px', height: '22px' }}></div>
          </div>
           {/* Iscream */}
          <div className="relative w-12 h-16 bg-pink-400 rounded-t-full rounded-b-lg bouncy-3">
             <div className="ear" style={{ left: '8px', transform: 'rotate(-30deg)' }}></div>
             <div className="ear" style={{ right: '8px', transform: 'rotate(30deg)' }}></div>
          </div>
        </div>
        <p className="mt-6 text-xl text-gray-400 font-semibold animate-pulse">
          Yo bro, I am working hard to find your stuff
        </p>
      </div>
    </>
  );
};
