export default function About() {
  return (
    // Lab 8.4：Header 的 Home 链接指向 #home，所以这个首屏区块用 id="home"
    <section id="home" className="about-me">
      {/* 左侧头像 */}
      <img
        src="/image/me.jpg"
        alt="Li Hanyong's profile photo"
        className="about-me-image"
      />

      {/* 右侧个人介绍与技能标签 */}
      <div className="about-me-text">
        <h2>About Me</h2>
        <p>
          Hello, I'm Li Hanyong, a passionate web developer in training, focused
          on creating beautiful and functional user interfaces.
        </p>

        <h3 className="skills-heading">Core Skills</h3>
        <ul className="skills-list">
          <li className="skill-tag">Semantic HTML5</li>
          <li className="skill-tag">Responsive CSS</li>
          <li className="skill-tag">Modern JavaScript</li>
        </ul>
      </div>
    </section>
  )
}
