import { useState } from 'react'
import { getSecureImageUrl } from '../utils/security'

const SecureImage = ({ src, alt, className, style, onError, onLoad, ...props }) => {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const secureUrl = getSecureImageUrl(src)

  const handleError = (e) => {
    setHasError(true)
    setIsLoading(false)
    if (onError) onError(e)
  }

  const handleLoad = (e) => {
    setIsLoading(false)
    setHasError(false)
    if (onLoad) onLoad(e)
  }

  if (!secureUrl || hasError) {
    return (
      <div 
        className={className}
        style={{
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.9rem',
          color: '#666',
          ...style
        }}
      >
        🔒 {alt || 'Image unavailable'}
      </div>
    )
  }

  return (
    <>
      {isLoading && (
        <div 
          className={className}
          style={{
            backgroundColor: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            color: '#666',
            ...style
          }}
        >
          Loading...
        </div>
      )}
      <img
        src={secureUrl}
        alt={alt}
        className={className}
        style={{ display: isLoading ? 'none' : 'block', ...style }}
        crossOrigin="anonymous"
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </>
  )
}

export default SecureImage