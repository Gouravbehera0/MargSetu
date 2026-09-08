import CarLoadingSpinner from './CarLoadingSpinner';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingState({
  message = 'Loading...',
  subMessage,
  size = 'md',
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <CarLoadingSpinner
        size={size}
        message={message}
        subMessage={subMessage}
        showSmoke={true}
      />
    </div>
  );
}

