import { useState } from "react"
import { Link } from "react-router-dom"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: any) => any;
  }
}

type InstallmentType = "one" | "two" | "three"

export default function PaymentCard() {
  const [installment, setInstallment] =
    useState<InstallmentType>("three")

  const totalAmount = 120
  const installmentAmount =
    installment === "one"
      ? totalAmount
      : installment === "two"
        ? totalAmount / 2
        : totalAmount / 3

  const handlePayment = () => {
    const rzp = new window.Razorpay({
      key: "rzp_test_1DP5mmOlF5G5ag",
      amount: installmentAmount * 100,
      currency: "USD",
      name: "Deep Eigen AI Labs",
      theme: { color: "#174CD2" },
    })
    rzp.open()
  }

  return (
    <div className="min-h-screen bg-[#EEF2FF] font-bricolage relative">
      {/* Back */}
      <Link
        to="/user_dashboard"
        className="absolute top-6 left-4 sm:left-10 md:left-20 lg:left-40 xl:left-60 text-md font-bold text-gray-600 hover:text-gray-900 transition-colors"
      >
        <i className="ri-arrow-left-line"></i> Go back
      </Link>

      {/* Card */}
      <div className="flex items-center justify-center min-h-screen px-4 py-20 sm:py-0">
        <div className="w-full max-w-[880px] bg-white rounded-2xl shadow-sm px-5 py-6 sm:px-10 sm:py-8 border border-gray-100">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Purchase Summary
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              <span className="font-medium text-gray-700">Order ID:</span> #20472183843
            </p>
          </div>

          {/* User Info */}
          <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:justify-between gap-3 mb-10">
            <p className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">Name:</span> John Doe
            </p>
            <p className="text-sm text-gray-700 break-all">
              <span className="font-medium text-gray-900">Registered Email:</span>{" "}
              johndoe@email.com
            </p>
          </div>

          {/* Subscribe */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
            <p className="text-xl sm:text-2xl font-semibold text-gray-900">
              Subscribe for
            </p>

            <div className="flex bg-gray-50 p-1 rounded-full border border-gray-200 overflow-x-auto scrollbar-hide">
              {[
                { key: "one", label: "1 Month" },
                { key: "two", label: "6 Months" },
                { key: "three", label: "1 Year" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() =>
                    setInstallment(item.key as InstallmentType)
                  }
                  className={`px-4 sm:px-6 py-2.5 text-xs sm:text-sm rounded-full transition-all font-semibold whitespace-nowrap ${installment === item.key
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Plan */}
          <div className="border-b border-gray-100 mb-6 flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-2">
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              Subscription Plan
            </p>

            <div>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">
                ${totalAmount}
              </p>
            </div>
          </div>

          <div className="mb-10">
            <p className="text-base sm:text-lg text-gray-600 font-medium">
              Basic – Essential & foundational courses
            </p>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Unlock access to all fundamental programming and web development courses in this tier.
            </p>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center mb-10 p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
            <p className="text-lg font-bold text-gray-900">
              Total Amount
            </p>
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-extrabold text-blue-700">
                ${installmentAmount.toFixed(0)}
              </p>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mt-1">
                {installment === "one" ? "One-time" : "Per Installment"}
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handlePayment}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all rounded-xl text-white font-bold text-lg shadow-lg shadow-blue-200"
          >
            Pay ${installmentAmount.toFixed(0)}
          </button>
        </div>
      </div>
    </div>
  )
}
