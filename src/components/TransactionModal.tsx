import React, { useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'waiting' | 'complete' | 'rejected';
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, status }) => {
  useEffect(() => {
    if (status === 'rejected' || status === 'complete') {
      const timer = setTimeout(() => {
        onClose();
      }, status === 'rejected' ? 1500 : 300);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-200`}>
      <div className={`bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4 transition-all duration-200 ${(status === 'complete' || status === 'rejected') ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        <div className="flex flex-col items-center gap-4">
          {status === 'complete' ? (
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          ) : status === 'rejected' ? (
            <XCircle className="w-12 h-12 text-red-400" />
          ) : (
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          )}
          <h3 className="text-xl font-semibold text-white">
            {status === 'complete' 
              ? 'Transaction Complete!' 
              : status === 'rejected'
              ? 'Transaction Rejected'
              : 'Processing Lamp Collection'}
          </h3>
          <div className="text-gray-300 text-center space-y-2">
            {status === 'waiting' && (
              <>
                <p>Please confirm the transaction in your wallet</p>
                <p className="text-sm text-gray-400">
                  This will record your lamp collection on the Monad network
                </p>
              </>
            )}
            {status === 'rejected' && (
              <p>Returning to game...</p>
            )}
          </div>
          <div className="mt-4 text-sm text-gray-400">
            <p>Transaction Status:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li className={
                status === 'waiting' 
                  ? 'text-yellow-400' 
                  : status === 'complete'
                  ? 'text-green-400'
                  : 'text-red-400'
              }>
                {status === 'rejected' ? 'Transaction rejected' : 'Waiting for confirmation'}
              </li>
              <li className={status === 'complete' ? 'text-green-400' : 'text-gray-500'}>
                Updating game state
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;