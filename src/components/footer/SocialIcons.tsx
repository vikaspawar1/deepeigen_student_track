import "../landing/footer.css"
import { FaLinkedin } from "react-icons/fa"; // or any icons you prefer

import insta from "../../assets/Hero/Images/instagram.svg"
import lab from "../../assets/Hero/Images/twitter-x.svg"
const SocialIcons = () => {
  return (
    <div className="social-icons">
    
      <a
        href="https://instagram.com/deepeigen"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
      >
     <img src={insta} alt="" />
      </a>
      <a
        href="https://twitter.com/deepeigen"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Twitter"
      >
        <img src={lab} alt="" />
      </a>
      <a
        href="https://www.linkedin.com/company/deepeigen"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
      >
        <FaLinkedin />
      </a>
    </div>
  );
};

export default SocialIcons;
