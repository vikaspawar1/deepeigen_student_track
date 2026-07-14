import certificates from "../../assets/Hero/Images/certificate.svg";
import books from "../../assets/Hero/Images/books.svg";
import lab from "../../assets/Hero/Images/lab.svg";
import teacher from "../../assets/Hero/Images/teacher.svg";
import note from "../../assets/Hero/Images/note.svg";

import collab from "../../assets/Hero/Images/collaboration.svg";
import infra from "../../assets/Hero/Images/infrastructure.svg";
import innovation from "../../assets/Hero/Images/innovation.svg";

import hero_video from "../../assets/course_videos/Hero-banner.mp4";
import robo_video from "../../assets/Hero/Videos/Deep-Eigen-Website-Hero-1.mp4";

import { useNavigate } from "react-router-dom";

export default function HeroSection() {
  const navigate = useNavigate();

  const mobileFeatures = [
    { img: books, label: "Basic to Advanced Courses" },
    { img: lab, label: "Access to Research Tools" },
    { img: teacher, label: "Experienced Coach" },
    { img: note, label: "Hands on Training" },
    { img: certificates, label: "Earn Certificates" },
  ];

  return (
    <>
      <div className="w-full bg-white mx-auto p-3 sm:p-6 box-border sm:px-[6vw] lg:px-[10vw] overflow-x-hidden">
        {/* Brilliance Initiated Banner */}
        <div className="relative flex justify-center items-center h-[clamp(7rem,16vw,12rem)] w-full rounded-[1.25rem] overflow-hidden">
          <video
            className="absolute inset-0 w-full h-full object-cover z-0"
            src={hero_video}
            autoPlay
            loop
            muted
            playsInline
          ></video>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[0.4rem] z-[1]"></div>
          <h1 className="text-white uppercase tracking-[0.26em] font-semibold text-[clamp(1.2rem,2vw+0.5rem,2.5rem)] text-center z-[2] px-4">
            Brilliance Initiated
          </h1>
        </div>

        {/* Hero Section */}
        <section className="mt-5 sm:mt-7 rounded-[1.25rem] bg-gradient-to-b from-[#DCEBF4] to-[#FEF1FF] flex flex-col md:flex-row gap-6 md:gap-[2vw] items-center justify-between py-8 md:py-[6vh] lg:py-[10vh] px-5 sm:px-8 md:px-[4vw]">
          {/* Left Content */}
          <div className="flex flex-col gap-5 md:gap-[1.7rem] flex-1 w-full md:max-w-[52%] text-center md:text-left">
            <div>
              <h2 className="text-[#1A212F] font-normal tracking-[0.02em] leading-[1.1] text-[clamp(1.8rem,3vw+0.5rem,3.5rem)]">
                Master <br /> State-of-the-Art AI
              </h2>

              <p className="max-w-[30rem] mx-auto md:mx-0 text-[#1A212F]/70 text-[clamp(0.9rem,1vw+0.4rem,1.375rem)] leading-[1.6] mt-3 sm:mt-4">
                Expert-led courses and an independent AI research lab advancing
                cutting-edge machine learning, computer vision, and robotics
              </p>
            </div>
            <button
              className="inline-flex h-[3rem] md:h-[3.25rem] items-center justify-center px-8 md:px-[4.25rem] rounded-lg bg-[#174CD2] text-white font-bold text-base md:text-lg border-none cursor-pointer transition-colors duration-300 ease-in-out w-fit mx-auto md:mx-0 hover:bg-[#0e38a5]"
              onClick={() => navigate("/login")}
            >
              Join Now
            </button>
          </div>

          {/* Right Content - Hero Video */}
          <div className="w-full flex-1 md:max-w-[46%] flex items-center justify-center">
            {/* 
              Height breakpoints:
              - mobile (<640px): 55vw — generous for small screens
              - sm (640px): 40vw
              - md (768px, iPad): 35vw — enough to look good on iPad
              - lg (1024px+): 22vw — desktop sizing
            */}
            <div className="relative h-[55vw] sm:h-[40vw] md:h-[35vw] lg:h-[22vw] w-full rounded-[20rem] bg-white overflow-hidden">
              <video
                className="absolute inset-0 w-full h-full object-cover z-0"
                src={robo_video}
                autoPlay
                loop
                muted
                playsInline
              ></video>
            </div>
          </div>
        </section>

        {/* Feature Cards - Tablet (md ~768px) as stacked, Desktop (lg 1024px+) as side-by-side */}
        {/* 
          On iPad (md, 768px): show two stacked cards (each full width)
          On desktop (lg, 992px+): show them side by side in a 7-col grid
        */}
        <section className="hidden md:block w-[95%] mx-auto mt-6 xl:-mt-12">
          {/* Desktop: side-by-side grid - only on extra large screens (1280px+) */}
          <div className="hidden xl:grid grid-cols-7 gap-6">
            {/* Courses Card */}
            <div className="relative bg-white col-span-3 rounded-[20px] px-6 py-8 shadow-[0_5px_18px_rgba(0,0,0,0.12)]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#dce8ff] text-[#2c3e63] px-[18px] py-[7px] rounded-full text-[15px] font-semibold whitespace-nowrap">
                Courses
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 min-h-[110px]">
                  <img src={books} alt="" className="w-[42px] h-[42px] object-contain mb-3" />
                  <p className="text-base text-[#333] leading-[1.4] font-medium">
                    Basic to Advanced Courses
                  </p>
                </div>
                <div className="w-px h-[55px] bg-[#d8d8d8]" />
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 min-h-[110px]">
                  <img src={teacher} alt="" className="w-[42px] h-[42px] object-contain mb-3" />
                  <p className="text-base text-[#333] leading-[1.4] font-medium">
                    Experienced <br /> Coach
                  </p>
                </div>
                <div className="w-px h-[55px] bg-[#d8d8d8]" />
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 min-h-[110px]">
                  <img src={certificates} alt="" className="w-[42px] h-[42px] object-contain mb-3" />
                  <p className="text-base text-[#333] leading-[1.4] font-medium">
                    Earn <br /> Certificates
                  </p>
                </div>
              </div>
            </div>

            {/* Research Labs Card */}
            <div className="relative bg-white col-span-4 rounded-[20px] px-6 py-8 shadow-[0_5px_18px_rgba(0,0,0,0.12)]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#dce8ff] text-[#2c3e63] px-[18px] py-[7px] rounded-full text-[15px] font-semibold whitespace-nowrap">
                Research Labs
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1 flex flex-col items-center justify-center text-center px-3 min-h-[110px]">
                  <img src={lab} alt="" className="w-[42px] h-[42px] object-contain mb-3" />
                  <p className="text-sm text-[#333] leading-[1.4] font-medium">
                    Access to Research Tools
                  </p>
                </div>
                <div className="w-px h-[55px] bg-[#d8d8d8]" />
                <div className="flex-1 flex flex-col items-center justify-center text-center px-3 min-h-[110px]">
                  <img src={infra} alt="" className="w-[42px] h-[42px] object-contain mb-3" />
                  <p className="text-sm text-[#333] leading-[1.4] font-medium">
                    State-of-the-Art Research Infrastructure
                  </p>
                </div>
                <div className="w-px h-[55px] bg-[#d8d8d8]" />
                <div className="flex-1 flex flex-col items-center justify-center text-center px-3 min-h-[110px]">
                  <img src={collab} alt="" className="w-[42px] h-[42px] object-contain mb-3" />
                  <p className="text-sm text-[#333] leading-[1.4] font-medium">
                    Collaboration with Researchers
                  </p>
                </div>
                <div className="w-px h-[55px] bg-[#d8d8d8]" />
                <div className="flex-1 flex flex-col items-center justify-center text-center px-3 min-h-[110px]">
                  <img src={innovation} alt="" className="w-[42px] h-[42px] object-contain mb-3" />
                  <p className="text-sm text-[#333] leading-[1.4] font-medium">
                    Innovation & Experimentation
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* iPad & Tablet (md to xl): two full-width stacked cards */}
          <div className="xl:hidden flex flex-col gap-6">
            {/* Courses Card */}
            <div className="relative bg-white rounded-[20px] px-6 py-8 shadow-[0_5px_18px_rgba(0,0,0,0.12)] border border-gray-100">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2  bg-[#dce8ff] text-black px-[18px] py-[7px] rounded-full text-[15px] font-semibold whitespace-nowrap">
                Courses
              </div>
              <div className="flex items-center justify-around">
                <div className="flex flex-col items-center text-center px-3 min-h-[100px] justify-center">
                  <img src={books} alt="" className="w-[40px] h-[40px] object-contain mb-2" />
                  <p className="text-sm text-[#333] leading-[1.4] font-medium max-w-[120px]">
                    Basic to Advanced Courses
                  </p>
                </div>
                <div className="w-px h-[50px] bg-[#d8d8d8]" />
                <div className="flex flex-col items-center text-center px-3 min-h-[100px] justify-center">
                  <img src={teacher} alt="" className="w-[40px] h-[40px] object-contain mb-2" />
                  <p className="text-sm text-[#333] leading-[1.4] font-medium max-w-[120px]">
                    Experienced Coach
                  </p>
                </div>
                <div className="w-px h-[50px] bg-[#d8d8d8]" />
                <div className="flex flex-col items-center text-center px-3 min-h-[100px] justify-center">
                  <img src={certificates} alt="" className="w-[40px] h-[40px] object-contain mb-2" />
                  <p className="text-sm text-[#333] leading-[1.4] font-medium max-w-[120px]">
                    Earn Certificates
                  </p>
                </div>
              </div>
            </div>

            {/* Research Labs Card */}
            <div className="relative bg-white rounded-[20px] px-6 py-8 shadow-[0_5px_18px_rgba(0,0,0,0.12)] border border-gray-100">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2  bg-[#dce8ff] text-black px-[18px] py-[7px] rounded-full text-[15px] font-semibold whitespace-nowrap">
                Research Labs
              </div>
              <div className="flex items-center justify-around flex-wrap gap-4">
                <div className="flex flex-col items-center text-center min-w-[100px] max-w-[130px]">
                  <img src={lab} alt="" className="w-[40px] h-[40px] object-contain mb-2" />
                  <p className="text-sm text-[#333] leading-[1.4] font-medium">
                    Access to Research Tools
                  </p>
                </div>
                <div className="flex flex-col items-center text-center min-w-[100px] max-w-[130px]">
                  <img src={infra} alt="" className="w-[40px] h-[40px] object-contain mb-2" />
                  <p className="text-sm text-[#333] leading-[1.4] font-medium">
                    State-of-the-Art Research Infrastructure
                  </p>
                </div>
                <div className="flex flex-col items-center text-center min-w-[100px] max-w-[130px]">
                  <img src={collab} alt="" className="w-[40px] h-[42px] object-contain mb-2" />
                  <p className="text-sm text-[#333] leading-[1.4] font-medium">
                    Collaboration with Researchers
                  </p>
                </div>
                <div className="flex flex-col items-center text-center min-w-[100px] max-w-[130px]">
                  <img src={innovation} alt="" className="w-[40px] h-[40px] object-contain mb-2" />
                  <p className="text-sm text-[#333] leading-[1.4] font-medium">
                    Innovation & Experimentation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid - Mobile only (below md) */}
        <section className="md:hidden bg-white rounded-[20px] mx-auto mt-6 px-4 py-6 shadow-[0_5px_18px_rgba(0,0,0,0.12)] relative z-10">
          <div className="grid grid-cols-2 gap-x-5 gap-y-8">
            {mobileFeatures.map((feature, i) => (
              <div
                key={feature.label}
                className={`flex flex-col items-center justify-center text-center gap-3 ${
                  i === mobileFeatures.length - 1 ? "col-span-2 justify-self-center max-w-[180px]" : ""
                }`}
              >
                <img src={feature.img} alt="" className="w-[46px] h-[46px] object-contain" />
                <p className="text-base text-[#333] leading-[1.35] font-medium">
                  {feature.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}