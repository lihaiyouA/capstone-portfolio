const currentYear = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="site-footer">
      <p>&copy; {currentYear} Li Hanyong. All rights reserved.</p>
      <p className="site-footer-meta">
        Built with React + React Router · Express + MongoDB · deployed on Vercel &amp; Render
      </p>
    </footer>
  )
}
