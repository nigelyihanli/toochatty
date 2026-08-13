export default function Footer() {
  return (
    <footer
      className="w-full text-center py-5 px-4 border-t border-gray-200 mt-auto"
      style={{ background: 'transparent' }}
    >
      <p style={{ fontFamily: "'Jua', sans-serif", fontSize: '14px', color: '#6b7280' }}>
        Questions? Contact us at{' '}
        <a
          href="mailto:support.toochatty@gmail.com"
          style={{ color: '#2F4780', textDecoration: 'underline' }}
        >
          support.toochatty@gmail.com
        </a>
      </p>
      <p className="text-xs text-gray-400 mt-1">© 2026 TooChatty. All rights reserved.</p>
    </footer>
  )
}
