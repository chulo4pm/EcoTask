import {
  ArrowLeft,
  MailCheck,
} from "lucide-react";

import { useState } from "react";
import volunteer from "./assets/voluteer.jpg";


/* =========================================================
   ECOTASK LOGO
========================================================= */

function EcoTaskLogo() {
  return (
    <div className="flex items-center font-black tracking-tight">

      <span className="text-[24px] text-[#1f5133]">
        Ec
      </span>

      <div className="mx-[2px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-[#4ade80] bg-[#075f2b]">

        <svg
          width="18"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 19V5"
            stroke="#86EFAC"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <path
            d="M6.5 10.5L12 5L17.5 10.5"
            stroke="#86EFAC"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

      </div>

      <span className="text-[24px] text-[#1f5133]">
        Task
      </span>

    </div>
  );
}


/* =========================================================
   VERIFICATION CODE
========================================================= */

function VerificationCode({
  onBack,
  onVerify,
  email,
}) {

  const [code, setCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);


  const handleChange = (value, index) => {

    if (!/^\d*$/.test(value)) {
      return;
    }


    const newCode = [...code];

    newCode[index] =
      value.slice(-1);

    setCode(newCode);


    /* AUTO MOVE TO NEXT INPUT */

    if (
      value &&
      index < 5
    ) {

      document
        .getElementById(
          `code-${index + 1}`
        )
        ?.focus();

    }

  };


  const handleKeyDown = (
    e,
    index
  ) => {

    if (
      e.key === "Backspace" &&
      !code[index] &&
      index > 0
    ) {

      document
        .getElementById(
          `code-${index - 1}`
        )
        ?.focus();

    }

  };


  const handleSubmit = (e) => {

    e.preventDefault();


    const verificationCode =
      code.join("");


    if (
      verificationCode.length !== 6
    ) {

      alert(
        "Please enter the 6-digit verification code."
      );

      return;

    }


    onVerify();

  };


  return (

    <div className="min-h-screen bg-[#315d42] flex items-center justify-center p-4">


      {/* =================================================
          MAIN CONTAINER
      ================================================= */}

      <div className="relative w-full max-w-[1200px] min-h-[670px] bg-white rounded-[28px] overflow-hidden shadow-2xl flex">


        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div className="relative hidden md:flex w-1/2 overflow-hidden">


          {/* BACKGROUND IMAGE */}

          <img
            src={volunteer}
            alt="Volunteers helping the environment"
            className="
              absolute
              inset-0
              w-full
              h-full
              object-cover
            "
          />


          {/* GREEN OVERLAY */}

          <div className="absolute inset-0 bg-[#008f35]/80"></div>


          {/* GRADIENT */}

          <div className="absolute inset-0 bg-gradient-to-b from-[#006b2d]/40 to-[#00a83b]/40"></div>


          {/* BACK BUTTON */}

          <button
            onClick={onBack}
            className="
              absolute
              top-6
              left-6
              z-20
              w-11
              h-11
              rounded-full
              bg-[#087a35]
              hover:bg-[#06652c]
              text-white
              flex
              items-center
              justify-center
              transition
            "
            aria-label="Back"
          >

            <ArrowLeft size={20} />

          </button>


          {/* LEFT CONTENT */}

          <div className="relative z-10 flex items-center w-full px-16">


            <div className="max-w-[430px] text-white">


              <h2 className="text-4xl font-semibold tracking-wide mb-3">

                VERIFY

              </h2>


              <div className="flex items-center gap-2 mb-6">


                <div className="w-24 h-[1px] bg-white"></div>


                <span className="text-2xl font-normal">

                  Your Account

                </span>


              </div>


              <p className="text-base leading-7 font-medium">

                We've sent a verification code to your email
                address. Enter the code to continue resetting
                your EcoTask password.

              </p>


            </div>


          </div>


        </div>


        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="w-full md:w-1/2 bg-white flex items-center justify-center px-8 sm:px-12 lg:px-20 py-12">


          <div className="w-full max-w-[500px]">


            {/* MOBILE BACK */}

            <button
              onClick={onBack}
              className="
                md:hidden
                mb-6
                w-10
                h-10
                rounded-full
                bg-[#159447]
                text-white
                flex
                items-center
                justify-center
              "
            >

              <ArrowLeft size={18} />

            </button>


            {/* LOGO */}

            <div className="flex justify-center mb-6">

              <EcoTaskLogo />

            </div>


            {/* EMAIL ICON */}

            <div
              className="
                mx-auto
                mb-6
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                bg-[#e8f7ec]
              "
            >

              <MailCheck
                size={30}
                className="text-[#159447]"
              />

            </div>


            {/* TITLE */}

            <h1 className="text-center text-4xl font-bold text-[#1f2937] mb-3">

              Check Your Email

            </h1>


            {/* DESCRIPTION */}

            <p className="text-center text-sm leading-6 text-[#6b7280] mb-3">

              We sent a 6-digit verification code to

            </p>


            {/* EMAIL */}

            <p className="text-center text-sm font-semibold text-[#159447] mb-8">

              {email || "your email address"}

            </p>


            {/* FORM */}

            <form onSubmit={handleSubmit}>


              {/* VERIFICATION CODE */}

              <div className="flex justify-center gap-2 sm:gap-3 mb-7">


                {code.map((digit, index) => (

                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) =>
                      handleChange(
                        e.target.value,
                        index
                      )
                    }
                    onKeyDown={(e) =>
                      handleKeyDown(
                        e,
                        index
                      )
                    }
                    className="
                      h-12
                      w-11
                      sm:h-14
                      sm:w-12
                      rounded-md
                      border
                      border-gray-300
                      text-center
                      text-lg
                      font-bold
                      text-[#1f5133]
                      outline-none
                      transition
                      focus:border-[#20b84b]
                      focus:ring-2
                      focus:ring-[#20b84b]/20
                    "
                  />

                ))}


              </div>


              {/* VERIFY BUTTON */}

              <button
                type="submit"
                className="
                  w-full
                  min-h-[54px]
                  bg-[#16b941]
                  hover:bg-[#12a83a]
                  text-white
                  font-semibold
                  rounded-md
                  transition
                  shadow-sm
                "
              >

                Verify Code

              </button>


            </form>


            {/* RESEND */}

            <p className="text-center text-sm text-[#6b7280] mt-6">


              Didn't receive the code?{" "}


              <button
                type="button"
                className="
                  font-semibold
                  text-[#159447]
                  hover:underline
                "
                onClick={() => {

                  alert(
                    "A new verification code has been sent."
                  );

                }}
              >

                Resend Code

              </button>


            </p>


            {/* BACK */}

            <button
              type="button"
              onClick={onBack}
              className="
                mx-auto
                mt-5
                flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-[#6b7280]
                hover:text-[#159447]
                transition
              "
            >

              <ArrowLeft size={16} />

              Back to Forgot Password

            </button>


          </div>


        </div>


      </div>


    </div>

  );

}


export default VerificationCode;