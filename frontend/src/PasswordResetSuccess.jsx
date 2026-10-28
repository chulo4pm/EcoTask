import {
  Check,
  ShieldCheck,
} from "lucide-react";

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
   PASSWORD RESET SUCCESS
========================================================= */

function PasswordResetSuccess({
  onBackToLogin,
}) {

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


          {/* LEFT CONTENT */}

          <div className="relative z-10 flex items-center w-full px-16">


            <div className="max-w-[430px] text-white">


              {/* SUCCESS ICON */}

              <div className="flex items-center gap-3 mb-5">

                <ShieldCheck
                  size={32}
                  className="text-white"
                />

                <span className="text-sm font-bold uppercase tracking-[0.2em]">

                  Password Updated

                </span>

              </div>


              {/* TITLE */}

              <h2 className="text-4xl font-semibold tracking-wide mb-3">

                ALL SET!

              </h2>


              {/* SUBTITLE */}

              <div className="flex items-center gap-2 mb-6">

                <div className="w-24 h-[1px] bg-white"></div>

                <span className="text-2xl font-normal">

                  You're Good to Go

                </span>

              </div>


              {/* DESCRIPTION */}

              <p className="text-base leading-7 font-medium">

                Your password has been successfully updated.
                You can now log in and continue making a
                positive impact with EcoTask.

              </p>


            </div>


          </div>


        </div>


        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="w-full md:w-1/2 bg-white flex items-center justify-center px-8 sm:px-12 lg:px-20 py-12">


          <div className="w-full max-w-[500px] text-center">


            {/* LOGO */}

            <div className="flex justify-center mb-8">

              <EcoTaskLogo />

            </div>


            {/* SUCCESS ICON */}

            <div
              className="
                mx-auto
                mb-7
                flex
                h-24
                w-24
                items-center
                justify-center
                rounded-full
                bg-[#e8f7ec]
              "
            >

              <div
                className="
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-full
                  bg-[#16b941]
                "
              >

                <Check
                  size={34}
                  strokeWidth={3}
                  className="text-white"
                />

              </div>

            </div>


            {/* TITLE */}

            <h1 className="text-4xl font-bold text-[#1f2937] mb-4">

              Password Reset!

            </h1>


            {/* DESCRIPTION */}

            <p className="mx-auto max-w-[380px] text-sm leading-7 text-[#6b7280]">

              Your password has been successfully reset.
              You can now log in using your new password.
              Any other devices that were signed in have been
              logged out.

            </p>


            {/* LOGIN BUTTON */}

            <button
              type="button"
              onClick={onBackToLogin}
              className="
                mt-9
                w-full
                min-h-[54px]
                rounded-md
                bg-[#16b941]
                text-white
                font-semibold
                shadow-sm
                transition
                hover:bg-[#12a83a]
                active:scale-[0.99]
              "
            >

              Back to Login

            </button>


            {/* SECURITY MESSAGE */}

            <p className="mt-6 text-xs leading-5 text-[#9ca3af]">

              For your security, please keep your password
              private and do not share it with anyone.

            </p>


          </div>


        </div>


      </div>


    </div>

  );

}


export default PasswordResetSuccess;