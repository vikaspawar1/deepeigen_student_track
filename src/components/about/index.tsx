import InstructorProfile from "./InstructorProfile";
import SanjeevsharmaImage from "../../assets/AboutUs/Images/sanjeevLNCT.png";
import hero_video from "../../assets/course_videos/Hero-banner.mp4";
import "./styles/aboutus.css";
import { useNavigate } from "react-router-dom";

import {
  Layers3,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Microscope,
  Rocket,
  Users,
  FlaskConical,
} from "lucide-react";

const Index = () => {

  const navigate = useNavigate();
       
  const instructorData = {
    name: "Sanjeev Sharma",
    title: "Instructor",
    bio: `He has been researching in motion planning, decision making under uncertainty and autonomous navigation since 2008.
    Over the past four years his research spanned across several areas of autonomous driving, including deep learning, computer vision, SLAM and visual odometry.
    He is a recipient of the AI Most Impact Global Smart Leaders Award in 2018. He is also a recipient of Top 40 Under 40 Data Scientist in India in 2019 award.
    His research at Swapapti Robots is to enable autonomous driving on Indian roads, has been covered by both the national and international media on several occasions.`,
    visionStatement:
      "Our vision is to educate a billion people & provide highest quality of knowledge through our courses, making cutting-edge education affordable and available to everyone",
    imageUrl: SanjeevsharmaImage,
  };

  const platformFeatures = [
    {
      icon: Layers3,
      title: "Comprehensive learning paths",
      description:
        "Structured courses that take you from beginner fundamentals to advanced AI topics.",
    },
    {
      icon: BookOpen,
      title: "Research-backed curriculum",
      description:
        "Industry-focused content shaped by the latest research and real-world applications.",
    },
    {
      icon: GraduationCap,
      title: "Learn from practitioners",
      description:
        "Courses taught by experienced AI practitioners and active researchers.",
    },
    {
      icon: ShieldCheck,
      title: "Earn certificates",
      description:
        "Showcase your achievements with certificates that reflect your expertise.",
    },
  ];

  const researchFeatures = [
    {
      icon: Microscope,
      title: "Advanced research tools",
      description:
        "Get hands-on with the tools used in cutting-edge AI research.",
    },
    {
      icon: Rocket,
      title: "State-of-the-art infrastructure",
      description:
        "Access compute and platforms built for modern experimentation.",
    },
    {
      icon: Users,
      title: "Collaborate with researchers",
      description:
        "Work alongside researchers, engineers, and fellow innovators.",
    },
    {
      icon: FlaskConical,
      title: "Experimentation-driven learning",
      description:
        "Learn by doing through hands-on projects and emerging technologies.",
    },
  ];

  return (
    <div className="about-us-wrapper max-w-[90vw] sm:max-w-[82vw] md:max-w-[88vw] lg:max-w-[80vw] mx-auto mt-10">
      <div className="about-us-container">

        {/* Hero */}
        <div className="relative flex justify-center items-center h-[clamp(8rem,18vw,12rem)] w-full rounded-3xl overflow-hidden">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src={hero_video}
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

          <h1 className="relative z-10 text-white uppercase tracking-[0.26em] font-semibold text-[clamp(1.5rem,2vw+1rem,2.5rem)] text-center">
            Brilliance Initiated
          </h1>
        </div>

        {/* Instructor */}
        <InstructorProfile {...instructorData} />

        {/* ===================== Platform ====================== */}

        <section className="py-16 lg:py-14">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left */}

            <div>
              {/* <p className="uppercase tracking-widest text-[#5C7CFA] font-semibold text-sm mb-5">
                THE PLATFORM
              </p> */}

              <h2 className="text-4xl lg:text-5xl font-bold text-[#111827] leading-tight">
                Deep Eigen
              </h2>

               <h2 className="mt-4 text-3xl font-medium text-gray-700">
                Learn AI. Build Expertise
              </h2>

              <p className="mt-4 text-lg text-gray-600 leading-9 ">
                Deep Eigen is an AI learning platform dedicated to delivering
                high-quality education through industry-relevant,
                research-driven courses.

                <br />
             

                From foundational concepts to advanced topics, our structured
                learning paths help learners develop deep technical expertise
                and practical skills.
              </p>

              <button   onClick={() => navigate("/showallcourses")}   className="mt-10 bg-[#174CD2] cursor-pointer hover:bg-[#123cb2] transition text-white px-7 py-4 rounded-lg font-semibold shadow-md">
                Explore Courses
              </button>
            </div>

            {/* Right */}

            <div className="grid sm:grid-cols-2 gap-6">
              {platformFeatures.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={index}
                    className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm transition"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                      <Icon className="text-[#174CD2]" size={26} />
                    </div>

                    <h3 className="font-bold text-xl text-gray-900 mb-4">
                      {item.title}
                    </h3>

                    <p className="text-gray-600 leading-8">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===================== Research ====================== */}

        <section className="py-16 lg:py-24 mb-20">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Cards */}

            <div className="order-2 lg:order-1 grid sm:grid-cols-2 gap-6">
              {researchFeatures.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={index}
                    className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm  transition"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                      <Icon className="text-[#174CD2]" size={26} />
                    </div>

                    <h3 className="font-bold text-xl text-gray-900 mb-4">
                      {item.title}
                    </h3>

                    <p className="text-gray-600 leading-8">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Content */}

            <div className="order-1 lg:order-2">
              {/* <p className="uppercase tracking-widest text-[#5C7CFA] font-semibold text-sm mb-5">
                RESEARCH DIVISION
              </p> */}

              <h2 className="text-4xl lg:text-5xl font-bold text-[#111827] leading-tight">
                Deep Eigen AI Labs
              </h2>

              <h3 className="mt-4 text-3xl font-medium text-gray-700">
                Where Learning Meets Research
              </h3>

              <p className="mt-8 text-lg text-gray-600 leading-9">
                Deep Eigen AI Labs is our research division focused on
                hands-on experimentation, innovation, and real-world AI
                research.

                <br />
       

                It provides learners with opportunities to explore cutting-edge
                technologies, collaborate with researchers, and gain practical
                experience beyond traditional coursework.
              </p>

               <button    onClick={() => navigate("/career")} className="mt-10 bg-[#174CD2] hover:bg-[#123cb2] cursor-pointer transition text-white px-12 py-4 rounded-lg font-semibold shadow-md">
                Join Us
              </button>
            </div>

            
          </div>
             
        </section>

      </div>
    </div>
  );
};

export default Index;