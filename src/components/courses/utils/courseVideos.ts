import computerVisionVideo from "../../../assets/videos/Computer Vision.mp4";
import generativeAiVideo from "../../../assets/videos/Generative Ai.mp4";
import machineLearningVideo from "../../../assets/videos/Machine Learning.mp4";
import mathematicalOptimizationVideo from "../../../assets/videos/Mathematical Optimisation.mp4";
import reinforcementLearningVideo from "../../../assets/videos/Reinforcement Learning.mp4";
import visualOdometryVideo from "../../../assets/videos/Visual Odometry.mp4";
import heroBannerVideo from "../../../assets/course_videos/Hero-banner.mp4";

export const getCourseVideo = (title: string): string => {
  const t = (title || "").toLowerCase();
  if (t.includes("machine learning")) {
    return machineLearningVideo;
  }
  if (t.includes("computer vision")) {
    return computerVisionVideo;
  }
  if (t.includes("generative ai") || t.includes("genai")) {
    return generativeAiVideo;
  }
  if (t.includes("mathematical optimisation") || t.includes("mathematical optimization")) {
    return mathematicalOptimizationVideo;
  }
  if (t.includes("reinforcement learning")) {
    return reinforcementLearningVideo;
  }
  if (t.includes("visual odometry") || t.includes("robotics and visual navigation")) {
    return visualOdometryVideo;
  }
  return heroBannerVideo;
};
