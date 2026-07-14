import type React from "react"

interface InstructorProfileProps {
  name: string
  title?: string
  bio: string
  visionStatement: string
  imageUrl: string
}

export const InstructorProfile: React.FC<InstructorProfileProps> = ({
  name,
  title = "Instructor",
  bio,
  visionStatement,
  imageUrl,
}) => {
  return (
    <div className="w-full  sm:max-w-[85vw] md:w-[95vw] lg:max-w-[80vw]  mx-auto my-3 px-0 sm:px-4  md:px-0 py-12 ">
      <div className="mb-12">
    
        

        <div className="flex flex-col md:flex-row gap-8 items-start max-w-[95vw] mx-auto ">
          <div className="flex-shrink-0 w-full md:w-[30vw] ">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={name}
              className="w-full h-80  sm:h-120  md:h-120 rounded-lg object-cover shadow-sm"
            />
          </div>

          {/* Instructor Info */}
          <div className="flex-1 w-full md:w-[45vw] px-10p py-5">
                <h2 className="text-4xl font-[400] text-gray-900 mb-2">Our {title}</h2>
            <h3 className="text-xl font-[500] text-[#174CD2]  cursor-pointer mb-4 transition-colors">
              {name}
            </h3>

            <p className="text-gray-600 w-full  sm:w-[35vw] md:w-[50vw] lg:w-[35vw]  font-[300] leading-relaxed text-md md:text-md lg:text-lg space-y-4">
              {bio.split("\n").map((paragraph, idx) => (
                <span key={idx} className="block">
                  {paragraph}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>

      {/* Vision Statement */}
      <div className=" rounded-lg p-8 md:p-12 bg-[#174CD20F]">
        <blockquote className="text-lg md:text-2xl font-normal text-center text-foreground leading-relaxed ">
          {`"${visionStatement}"`}
        </blockquote>
      </div>
    </div>
  )
}

export default InstructorProfile
