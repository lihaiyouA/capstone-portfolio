// 受控表单（Controlled Component）：value 来自 state，onChange 写回 state。
// 期末版把 Lab 里的 console.log 换成了真正的 POST /api/contact，
// 并补上「发送中 / 成功 / 失败」三种状态。
import { useState } from 'react'
import { api } from '../api/client'

const EMPTY_FORM = {
  name: '',
  email: '',
  message: '',
}

// 留言的最少字符数（Lab 里就有的校验，保留）
const MIN_MESSAGE_LENGTH = 10

export default function ContactForm() {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // 用户重新输入时清掉上一次的错误与成功提示
    if (error) setError('')
    if (isSent) setIsSent(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (formData.message.trim().length < MIN_MESSAGE_LENGTH) {
      setError(`Please write at least ${MIN_MESSAGE_LENGTH} characters in your message.`)
      return
    }

    setIsSending(true)
    setError('')
    try {
      await api.sendMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      })
      setFormData(EMPTY_FORM)
      setIsSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="contact-name">Your Name</label>
        <input
          id="contact-name"
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          maxLength={80}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="contact-email">Your Email</label>
        <input
          id="contact-email"
          type="email"
          name="email"
          placeholder="Your Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="contact-message">Your Message</label>
        <textarea
          id="contact-message"
          name="message"
          placeholder="Your Message"
          value={formData.message}
          onChange={handleChange}
          rows={5}
          maxLength={2000}
          required
        />
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {isSent && (
        <p className="form-success" role="status">
          Thanks! Your message has been saved — I'll get back to you soon.
        </p>
      )}

      <button className="form-submit" type="submit" disabled={isSending}>
        {isSending ? 'Sending…' : isSent ? 'Message Sent!' : 'Send Message'}
      </button>
    </form>
  )
}
