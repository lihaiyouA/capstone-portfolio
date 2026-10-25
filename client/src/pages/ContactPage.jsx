import ContactForm from '../components/ContactForm'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function ContactPage() {
  useDocumentTitle('Contact | Li Hanyong')

  return (
    <section id="contact" className="contact-section">
      <h2>Contact Me</h2>
      <p className="contact-intro">
        Have a project in mind, or just want to say hi? Fill in the form below — your message is
        saved to my database and I'll get back to you.
      </p>

      <ContactForm />

      <div className="contact-info">
        <h3>Other ways to reach me</h3>
        <ul>
          <li>
            Email: <a href="mailto:lihanyong@test.com">lihanyong@test.com</a>
          </li>
          <li>
            GitHub: <a href="https://github.com/">github.com/LiHanyouA</a>
          </li>
        </ul>
      </div>
    </section>
  )
}
