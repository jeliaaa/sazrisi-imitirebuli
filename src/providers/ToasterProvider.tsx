import { Toaster } from 'react-hot-toast'

const ToasterProvider = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1a202c',
          color: '#fafcff',
          border: '1px solid rgba(255, 153, 0, 0.15)',
          borderRadius: '2px',
          fontSize: '14px',
          letterSpacing: '0.03em',
          padding: '12px 16px',
          boxShadow: '0 0 20px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.3)',
        },
        success: {
          iconTheme: {
            primary: 'green',
            secondary: '#1a202c',
          },
          style: {
            background: '#1a202c',
            color: '#fafcff',
            border: '1px solid green',
            boxShadow: '0 0 20px rgba(255, 153, 0, 0.1), 0 0 40px rgba(0,0,0,0.3)',
          },
        },
        error: {
          iconTheme: {
            primary: 'red',
            secondary: '#1a202c',
          },
          style: {
            background: '#1a202c',
            color: '#fafcff',
            border: '1px solid red',
            boxShadow: '0 0 20px rgba(255, 77, 77, 0.1), 0 0 40px rgba(0,0,0,0.3)',
          },
        },
      }}
    />
  )
}

export default ToasterProvider