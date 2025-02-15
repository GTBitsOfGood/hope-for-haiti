"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePartnerAccountScreen() {
  const [step, setStep] = useState(1);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const router = useRouter();

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 10));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleCancelClick = () => {
    setShowConfirmCancel(true);
  };

  const confirmCancel = () => {
    setShowConfirmCancel(false);
    router.push("/account_management");
  };


  const getCircleStyle = (isActive: boolean) => {
    return isActive
      ? { backgroundColor: "rgba(239, 51, 64, 0.8)", border: "1.5px solid rgba(239, 51, 64, 0.8)", color: "#FFF" }
      : { backgroundColor: "rgba(239, 51, 64, 0.2)", border: "1.5px solid rgba(239, 51, 64, 0.2)", color: "#FFF" };
  };

  //step 7 states
  const [menChecked, setMenChecked] = useState(false);
  const [womenChecked, setWomenChecked] = useState(false);
  const [boysChecked, setBoysChecked] = useState(false);
  const [girlsChecked, setGirlsChecked] = useState(false);
  const [babyBoysChecked, setBabyBoysChecked] = useState(false);
  const [babyGirlsChecked, setBabyGirlsChecked] = useState(false);


  return (
    <div className="min-h-screen w-full bg-white">
      <header className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold">Create Partner Account</h1>
      </header>

      <div className="max-w-3xl mx-auto py-8 px-6">
        <div className="flex items-center justify-between mb-6 w-full">
          {[...Array(10)].map((_, i) => {
            const index = i + 1;
            const isActive = index <= step;
            return (
              <div key={i} className="flex items-center w-full">
                <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium" style={getCircleStyle(isActive)}>
                  {index}
                </div>
                {index < 10 && <div className="flex-1 h-0.5 bg-gray-300" />}
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold mb-2">Create partner account</h2>
            <h3 className="font-semibold text-gray-700 mb-4">General information</h3>

            <div className="space-y-4">
              <label className="block font-medium text-gray-800">Site name</label>
              <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Site name" />

              <label className="block font-medium text-gray-800">Address</label>
              <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Address" />

              <label className="block font-medium text-gray-800">Department</label>
              <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Department" />

              <label className="block font-medium text-gray-800">GPS coordinates</label>
              <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="GPS coordinates" />

              <label className="block font-medium text-gray-800">Website</label>
              <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Website" />

              <label className="block font-medium text-gray-800">Social media (Instagram/Facebook)</label>
              <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Social media (Instagram/Facebook)" />
            </div>

            <div className="flex justify-between mt-6">
              <button className="text-mainRed font-semibold" onClick={handleCancelClick}>
                Cancel account creation
              </button>
              <button className="bg-mainRed text-white px-6 py-3 rounded-lg font-semibold" onClick={nextStep}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold mb-2">Create partner account</h2>
            <h3 className="font-semibold text-gray-700 mb-4">Contact Information</h3>

            <div className="mb-6">
              <h4 className="font-semibold">Regional Contact</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600">First name</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="First name" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Last name</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Last name" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Org title</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Org title" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Primary telephone</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="000-000-0000" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Secondary telephone</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="000-000-0000" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Email</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="example@gmail.com" />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold">Medical Contact</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600">First name</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="First name" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Last name</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Last name" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Org title</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Org title" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Primary telephone</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="000-000-0000" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Secondary telephone</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="000-000-0000" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Email</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="example@gmail.com" />
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h4 className="font-semibold">Admin Director</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600">First name</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="First name" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Last name</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Last name" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Org title</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Org title" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Primary telephone</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="000-000-0000" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Secondary telephone</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="000-000-0000" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Email</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="example@gmail.com" />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold">Pharmacy</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600">First name</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="First name" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Last name</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Last name" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Org title</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Org title" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Primary telephone</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="000-000-0000" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Secondary telephone</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="000-000-0000" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Email</label>
                  <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="example@gmail.com" />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold">WhatsApp Contact</h4>
              <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="WhatsApp contact" />
            </div>

            <div className="mb-6">
              <h4 className="font-semibold">WhatsApp Number</h4>
              <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="000-000-0000" />
            </div>

            <div className="flex justify-between mt-6">
              <button className="text-mainRed font-semibold" onClick={handleCancelClick}>
                Cancel account creation
              </button>
              <div>
                <button className="border border-mainRed text-mainRed px-6 py-3 rounded-lg font-semibold mr-4" onClick={prevStep}>
                  Previous
                </button>
                <button className="bg-mainRed text-white px-6 py-3 rounded-lg font-semibold" onClick={nextStep}>
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-bold mb-2">Create partner account</h2>
            <h3 className="font-semibold text-gray-700 mb-4">Introduction</h3>

            <label className="block font-medium text-gray-800">Organization history</label>
            <textarea className="w-full p-3 border rounded-lg text-gray-700" placeholder="Organization history" />

            <h4 className="font-semibold mt-4">Type of support requested</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="radio" name="supportType" className="mr-2" /> Ongoing support
              </label>
              <label className="flex items-center">
                <input type="radio" name="supportType" className="mr-2" /> Mobile clinic support
              </label>
              <label className="flex items-center">
                <input type="radio" name="supportType" className="mr-2" /> One-time request
              </label>
              <label className="flex items-center">
                <input type="radio" name="supportType" className="mr-2" /> Project support
              </label>
            </div>

            <label className="block font-medium text-gray-800 mt-4">Date organization was established</label>
            <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="00/00/0000" />

            <h4 className="font-semibold mt-4">Is your organization registered with MSSP?</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="radio" name="msspRegistration" className="mr-2" /> Yes
              </label>
              <label className="block font-medium text-gray-800">License Information</label>
              <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Enter license details" />
              <label className="flex items-center">
                <input type="radio" name="msspRegistration" className="mr-2" /> No
              </label>
            </div>

            <label className="block font-medium text-gray-800 mt-4">Program updates since last report</label>
            <textarea className="w-full p-3 border rounded-lg text-gray-700" placeholder="Updates" />

            <div className="flex justify-between mt-6">
              <button className="text-mainRed font-semibold" onClick={handleCancelClick}>
                Cancel account creation
              </button>
              <div>
                <button className="border border-mainRed text-mainRed px-6 py-3 rounded-lg font-semibold mr-4" onClick={prevStep}>
                  Previous
                </button>
                <button className="bg-mainRed text-white px-6 py-3 rounded-lg font-semibold" onClick={nextStep}>
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {showConfirmCancel && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
              <h2 className="text-xl font-bold mb-4">Cancel Account Creation</h2>
              <p className="mb-4">Are you sure you want to cancel creating this partner account?</p>
              <div className="flex justify-between">
                <button className="border border-gray-500 px-4 py-2 rounded-lg" onClick={() => setShowConfirmCancel(false)}>
                  No, go back
                </button>
                <button className="bg-mainRed text-white px-4 py-2 rounded-lg" onClick={confirmCancel}>
                  Yes, cancel
                </button>
              </div>
            </div>
          </div>
        )}


        {step === 4 && (
        <>
            <h2 className="text-xl font-bold mb-2">Create partner account</h2>
            <h3 className="font-semibold text-gray-700 mb-4">Facility information</h3>

            <p className="text-sm mb-2">
            <strong>What type of facility is it? Select all that apply:</strong>
            </p>


            <div className="grid grid-cols-3 gap-4 mb-4">

            <div className="space-y-2">
                {[
                "Birthing center",
                "Clinic",
                "Hospital",
                "Elderly care",
                "Rehabilitation center",
                ].map((facility) => (
                <label key={facility} className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    {facility}
                </label>
                ))}
            </div>

            <div className="space-y-2">
                {[
                "Dispensary",
                "Orphanage",
                "Primary care",
                "Nutrition/feeding",
                "Health center",
                ].map((facility) => (
                <label key={facility} className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    {facility}
                </label>
                ))}
            </div>

            <div className="space-y-2">
                {[
                "Community health education",
                "Secondary/tertiary healthcare (including surgery)",
                ].map((facility) => (
                <label key={facility} className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    {facility}
                </label>
                ))}
            </div>
            </div>

            <p className="text-sm mb-2">
            <strong>What type of facility is it? Select all that apply:</strong>
            </p>
            <div className="space-y-2 mb-4">
            {["Non-profit", "For profit", "Faith-based"].map((ftype) => (
                <label key={ftype} className="flex items-center">
                <input type="checkbox" className="mr-2" />
                {ftype}
                </label>
            ))}
            </div>

            <label className="block font-medium text-gray-800">
            Is this a government-run organization?
            </label>
            <div className="space-y-2 mb-4">
            <label className="flex items-center">
                <input type="radio" name="governmentOrg" className="mr-2" /> Yes
            </label>
            <label className="flex items-center">
                <input type="radio" name="governmentOrg" className="mr-2" /> No
            </label>
            </div>

            <label className="block font-medium text-gray-800">
            Do you have an Emergency Medical Records (EMR) System?
            </label>
            <div className="space-y-2 mb-4">
            <label className="flex items-center">
                <input type="radio" name="emrSystem" className="mr-2" /> Yes
            </label>
            <input
                className="w-full p-3 border rounded-lg text-gray-700"
                placeholder="Input name"
            />
            <label className="flex items-center">
                <input type="radio" name="emrSystem" className="mr-2" /> No
            </label>
            </div>

            <label className="block font-medium text-gray-800">
            Number of inpatient beds
            </label>
            <input
            className="w-full p-3 border rounded-lg text-gray-700 mb-4"
            placeholder="Number"
            />

            <label className="block font-medium text-gray-800">
            Number of patients served annually
            </label>
            <input
            className="w-full p-3 border rounded-lg text-gray-700 mb-4"
            placeholder="Number"
            />

            <p className="font-medium text-gray-800">Do you offer community/mobile outreach?</p>
            <div className="space-y-2 mb-2">
            <label className="flex items-center">
                <input type="radio" name="communityOutreach" className="mr-2" /> Yes
            </label>
            <div className="ml-6 mb-2">
                <label className="block text-sm text-gray-600">
                How often and what services?
                </label>
                <input
                className="w-full p-3 border rounded-lg text-gray-700"
                placeholder="Service"
                />
            </div>
            <label className="flex items-center">
                <input type="radio" name="communityOutreach" className="mr-2" /> No
            </label>
            </div>

            <div className="flex justify-between mt-6">
            <button className="text-mainRed font-semibold" onClick={handleCancelClick}>
                Cancel account creation
            </button>
            <div>
                <button
                className="border border-mainRed text-mainRed px-6 py-3 rounded-lg font-semibold mr-4"
                onClick={prevStep}
                >
                Previous
                </button>
                <button
                className="bg-mainRed text-white px-6 py-3 rounded-lg font-semibold"
                onClick={nextStep}
                >
                Next
                </button>
            </div>
            </div>
        </>
        )}


        {step === 5 && (
          <>
            <h2 className="text-xl font-bold mb-2">Create partner account</h2>
            <h3 className="font-semibold text-gray-700 mb-4">Infrastructure and services</h3>

            <p className="mb-4 text-sm">
              Please provide a general description of your facility including the type and number of buildings.
            </p>
            <textarea className="w-full p-3 border rounded-lg text-gray-700 mb-4" placeholder="Description" rows={4} />

            <p className="font-medium text-gray-800">Does your facility provide access to clean water?</p>
            <div className="space-y-2 mb-2">
              <label className="flex items-center">
                <input type="radio" name="cleanWater" className="mr-2" /> Yes
              </label>
              <div className="ml-6 mb-2">
                <label className="block text-sm text-gray-600">Please specify how</label>
                <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Answer" />
              </div>
              <label className="flex items-center">
                <input type="radio" name="cleanWater" className="mr-2" /> No
              </label>
              <div className="ml-6">
                <label className="block text-sm text-gray-600">Where is the closest water source?</label>
                <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Answer" />
              </div>
            </div>

            <p className="font-medium text-gray-800 mt-4">Does your facility have sanitation facilities?</p>
            <div className="space-y-2 mb-2">
              <label className="flex items-center">
                <input type="radio" name="sanitation" className="mr-2" /> Yes
              </label>
              <div className="ml-6 mb-2">
                <label className="block text-sm text-gray-600">Do they lock from the inside?</label>
                <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Answer" />
              </div>
              <label className="flex items-center">
                <input type="radio" name="sanitation" className="mr-2" /> No
              </label>
            </div>

            <p className="font-medium text-gray-800 mt-4">Is there electricity at your facility?</p>
            <div className="space-y-2 mb-4">
              <label className="flex items-center">
                <input type="radio" name="electricity" className="mr-2" /> Yes
              </label>
              <label className="flex items-center">
                <input type="radio" name="electricity" className="mr-2" /> No
              </label>
            </div>

            <p className="font-medium text-gray-800">Is your facility accessible to disabled patients?</p>
            <div className="space-y-2 mb-4">
              <label className="flex items-center">
                <input type="radio" name="disabledAccess" className="mr-2" /> Yes
              </label>
              <label className="flex items-center">
                <input type="radio" name="disabledAccess" className="mr-2" /> No
              </label>
            </div>

            <p className="font-medium text-gray-800">Does your facility have a proper medication disposal process?</p>
            <div className="space-y-2 mb-2">
              <label className="flex items-center">
                <input type="radio" name="medDisposal" className="mr-2" /> Yes
              </label>
              <div className="ml-6 mb-2">
                <label className="block text-sm text-gray-600">Please describe the process</label>
                <textarea className="w-full p-3 border rounded-lg text-gray-700" placeholder="Describe" rows={3} />
              </div>
              <label className="flex items-center">
                <input type="radio" name="medDisposal" className="mr-2" /> No
              </label>
            </div>

            <p className="font-medium text-gray-800 mt-4">Do you have a vehicle to pick up supplies from the depot?</p>
            <div className="space-y-2 mb-2">
              <label className="flex items-center">
                <input type="radio" name="vehicle" className="mr-2" /> Yes
              </label>
              <div className="ml-6 mb-2">
                <label className="block text-sm text-gray-600">Specify type of vehicle</label>
                <input className="w-full p-3 border rounded-lg text-gray-700" placeholder="Describe" />
              </div>

              <label className="block text-sm text-gray-600 ml-6">Which location is preferred for supply pick up?</label>
              <div className="ml-8 space-y-2 mb-2">
                <label className="flex items-center">
                  <input type="radio" name="pickUpLocation" className="mr-2" /> Les Cayes
                </label>
                <label className="flex items-center">
                  <input type="radio" name="pickUpLocation" className="mr-2" /> Port-au-Prince
                </label>
              </div>

              <label className="flex items-center">
                <input type="radio" name="vehicle" className="mr-2" /> No
              </label>
            </div>

            <div className="flex justify-between mt-6">
              <button className="text-mainRed font-semibold" onClick={handleCancelClick}>
                Cancel account creation
              </button>
              <div>
                <button
                  className="border border-mainRed text-mainRed px-6 py-3 rounded-lg font-semibold mr-4"
                  onClick={prevStep}
                >
                  Previous
                </button>
                <button
                  className="bg-mainRed text-white px-6 py-3 rounded-lg font-semibold"
                  onClick={nextStep}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
        {step === 6 && (
        <>
            <h2 className="text-xl font-bold mb-2">Create partner account</h2>
            <h3 className="font-semibold text-gray-700 mb-4">Programs & services provided</h3>
            <p className="mb-4">Select all of the medical services your organization provides.</p>

            <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Cancer
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Dentistry
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Dermatology
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Hematology
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Immunizations
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Parasitic infections
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Acute respiratory infections
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Vector-borne diseases
                </label>
            </div>
            <div className="space-y-2">
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Chronic diseases
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Diarrheal diseases
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Vaccine-preventable diseases
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Infectious diseases
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Neurology
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Malnutrition
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Ophthalmology
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Ears-nose-throat
                </label>
            </div>
            <div className="space-y-2">
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Orthopedics and rehabilitation
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Pediatrics
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Radiology
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Wound care
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Maternal care
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Lab tests
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Trauma and surgery
                </label>
                <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Urology
                </label>
            </div>
            </div>

            <label className="block font-medium text-gray-800 mb-2">
            Please list other services provided not listed above:
            </label>
            <textarea
            className="w-full p-3 border rounded-lg text-gray-700 mb-4"
            placeholder="List"
            />

            <div className="flex justify-between mt-6">
            <button className="text-mainRed font-semibold" onClick={prevStep}>
                Cancel account creation
            </button>
            <div>
                <button
                className="border border-mainRed text-mainRed px-6 py-3 rounded-lg font-semibold mr-4"
                onClick={prevStep}
                >
                Previous
                </button>
                <button
                className="bg-mainRed text-white px-6 py-3 rounded-lg font-semibold"
                onClick={nextStep}
                >
                Next
                </button>
            </div>
            </div>
        </>
        )}



{step === 7 && (
        <>
          <h2 className="text-xl font-bold mb-2">Create partner account</h2>
          <h3 className="font-semibold text-gray-700 mb-4">Finances</h3>

          <label className="block font-medium text-gray-800 mb-2">
            What happens with patients who cannot pay?
          </label>
          <textarea
            className="w-full p-3 border rounded-lg text-gray-700 mb-4"
            placeholder="Paragraph"
            rows={4}
          />

          <label className="block font-medium text-gray-800">
            Percentage of patients needing financial aid
          </label>
          <input
            className="w-full p-3 border rounded-lg text-gray-700 mb-4"
            placeholder="Percentage"
          />

          <label className="block font-medium text-gray-800">
            Percentage of patients receiving free treatment
          </label>
          <input
            className="w-full p-3 border rounded-lg text-gray-700 mb-4"
            placeholder="Percentage"
          />

          <p className="font-medium text-gray-800 mb-2">
            Annual spending on medications and medical supplies (select a range in USD)
          </p>
          <div className="space-y-2 mb-4">
            <label className="flex items-center">
              <input type="radio" name="annualSpending" className="mr-2 accent-mainRed" />
              $1 - $5,000
            </label>
            <label className="flex items-center">
              <input type="radio" name="annualSpending" className="mr-2 accent-mainRed" />
              $5,001 - $10,000
            </label>
            <label className="flex items-center">
              <input type="radio" name="annualSpending" className="mr-2 accent-mainRed" />
              $10,001 - $25,000
            </label>
            <label className="flex items-center">
              <input type="radio" name="annualSpending" className="mr-2 accent-mainRed" />
              $25,001 - $50,000
            </label>
            <label className="flex items-center">
              <input type="radio" name="annualSpending" className="mr-2 accent-mainRed" />
              $50,001 - $100,000
            </label>
            <label className="flex items-center">
              <input type="radio" name="annualSpending" className="mr-2 accent-mainRed" />
              $100,001+
            </label>
          </div>

          <p className="font-medium text-gray-800 mb-2">
            Does your organization track the number of prescriptions prescribed each year?
          </p>
          <div className="space-y-2 mb-4">
            <label className="flex items-center">
              <input type="radio" name="trackPrescriptions" className="mr-2 accent-mainRed" /> Yes
            </label>
            <label className="flex items-center">
              <input type="radio" name="trackPrescriptions" className="mr-2 accent-mainRed" /> No
            </label>
          </div>

          <label className="block font-medium text-gray-800">
            Total number of course treatments prescribed annually
          </label>
          <input
            className="w-full p-3 border rounded-lg text-gray-700 mb-4"
            placeholder="List"
          />

          <p className="font-medium text-gray-800 mb-2">
            Number of patients served last year. Select all that apply
          </p>
          <div className="space-y-2 mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="accent-mainRed"
                onChange={(e) => setMenChecked(e.target.checked)}
              />
              <span>Men (18+)</span>
              {menChecked && (
                <input
                  className="w-24 p-2 border rounded-lg text-gray-700 ml-2"
                  placeholder="Number"
                />
              )}
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="accent-mainRed"
                onChange={(e) => setWomenChecked(e.target.checked)}
              />
              <span>Women (18+)</span>
              {womenChecked && (
                <input
                  className="w-24 p-2 border rounded-lg text-gray-700 ml-2"
                  placeholder="Number"
                />
              )}
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="accent-mainRed"
                onChange={(e) => setBoysChecked(e.target.checked)}
              />
              <span>Boys (1-17)</span>
              {boysChecked && (
                <input
                  className="w-24 p-2 border rounded-lg text-gray-700 ml-2"
                  placeholder="Number"
                />
              )}
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="accent-mainRed"
                onChange={(e) => setGirlsChecked(e.target.checked)}
              />
              <span>Girls (1-17)</span>
              {girlsChecked && (
                <input
                  className="w-24 p-2 border rounded-lg text-gray-700 ml-2"
                  placeholder="Number"
                />
              )}
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="accent-mainRed"
                onChange={(e) => setBabyBoysChecked(e.target.checked)}
              />
              <span>Baby boys (&lt;1)</span>
              {babyBoysChecked && (
                <input
                  className="w-24 p-2 border rounded-lg text-gray-700 ml-2"
                  placeholder="Number"
                />
              )}
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="accent-mainRed"
                onChange={(e) => setBabyGirlsChecked(e.target.checked)}
              />
              <span>Baby girls (&lt;1)</span>
              {babyGirlsChecked && (
                <input
                  className="w-24 p-2 border rounded-lg text-gray-700 ml-2"
                  placeholder="Number"
                />
              )}
            </label>
          </div>

          <label className="block font-medium text-gray-800">Total number of patients served</label>
          <input
            className="w-full p-3 border rounded-lg text-gray-700 mb-4"
            placeholder="List"
          />

          <div className="flex justify-between mt-6">
            <button className="text-mainRed font-semibold" onClick={prevStep}>
              Cancel account creation
            </button>
            <div>
              <button
                className="border border-mainRed text-mainRed px-6 py-3 rounded-lg font-semibold mr-4"
                onClick={prevStep}
              >
                Previous
              </button>
              <button
                className="bg-mainRed text-white px-6 py-3 rounded-lg font-semibold"
                onClick={nextStep}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

        {step === 8 && (
        <>
            <h2 className="text-xl font-bold mb-2">Create partner account</h2>
            <h3 className="font-semibold text-gray-700 mb-4">Staff Information</h3>

            <label className="block font-medium text-gray-800">Number of doctors</label>
            <input className="w-full p-3 border rounded-lg text-gray-700 mb-4" placeholder="Number" />

            <label className="block font-medium text-gray-800">Number of nurses</label>
            <input className="w-full p-3 border rounded-lg text-gray-700 mb-4" placeholder="Number" />

            <label className="block font-medium text-gray-800">Number of midwives</label>
            <input className="w-full p-3 border rounded-lg text-gray-700 mb-4" placeholder="Number" />

            <label className="block font-medium text-gray-800">Number of auxiliaries</label>
            <input className="w-full p-3 border rounded-lg text-gray-700 mb-4" placeholder="Number" />

            <label className="block font-medium text-gray-800">Number of statisticians</label>
            <input className="w-full p-3 border rounded-lg text-gray-700 mb-4" placeholder="Number" />

            <label className="block font-medium text-gray-800">Number of pharmacists</label>
            <input className="w-full p-3 border rounded-lg text-gray-700 mb-4" placeholder="Number" />

            <label className="block font-medium text-gray-800">Number of CHW</label>
            <input className="w-full p-3 border rounded-lg text-gray-700 mb-4" placeholder="Number" />

            <label className="block font-medium text-gray-800">Number of administrative</label>
            <input className="w-full p-3 border rounded-lg text-gray-700 mb-4" placeholder="Number" />

            <label className="block font-medium text-gray-800">Number of health officers</label>
            <input className="w-full p-3 border rounded-lg text-gray-700 mb-4" placeholder="Number" />

            <label className="block font-medium text-gray-800">Total number of staff</label>
            <input className="w-full p-3 border rounded-lg text-gray-700 mb-4" placeholder="Number" />

            <label className="block font-medium text-gray-800">Other staff not listed</label>
            <input className="w-full p-3 border rounded-lg text-gray-700 mb-4" placeholder="Other staff not listed" />

            <div className="flex justify-between mt-6">
            <button className="text-mainRed font-semibold" onClick={prevStep}>
                Cancel account creation
            </button>
            <div>
                <button
                className="border border-mainRed text-mainRed px-6 py-3 rounded-lg font-semibold mr-4"
                onClick={prevStep}
                >
                Previous
                </button>
                <button
                className="bg-mainRed text-white px-6 py-3 rounded-lg font-semibold"
                onClick={nextStep}
                >
                Next
                </button>
            </div>
            </div>
        </>
        )}


        {step === 9 && (
        <>
            <h2 className="text-xl font-bold mb-2">Create partner account</h2>
            <h3 className="font-semibold text-gray-700 mb-4">Medical Supplies</h3>

            <p className="mb-4">
            Please select all categories of medications and medical supplies most needed.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
                <h4 className="font-semibold mb-2">Medications</h4>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Anesthetics</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Antipyretics/NSAIDs</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Antiallergics</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Anti-infectives</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Antineoplastics</span>
                </label>
            </div>
            <div>
                <label className="flex items-center space-x-2 mt-8">
                <input type="checkbox" />
                <span>Cardiovascular</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Dermatological</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Diagnostics</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Diuretics</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Gastrointestinal</span>
                </label>
            </div>
            <div>
                <label className="flex items-center space-x-2 mt-8">
                <input type="checkbox" />
                <span>Ophthalmological</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Respiratory</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Replacements</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Vitamins/minerals</span>
                </label>
            </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
                <h4 className="font-semibold mb-2">Medical supplies</h4>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Bandages</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Braces</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Hospital Consumables</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Dental</span>
                </label>
            </div>
            <div>
                <label className="flex items-center space-x-2 mt-8">
                <input type="checkbox" />
                <span>Diagnostic</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Personal Care</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Prosthetics</span>
                </label>
            </div>
            <div>
                <label className="flex items-center space-x-2 mt-8">
                <input type="checkbox" />
                <span>Respiratory</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Surgical</span>
                </label>
                <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Syringes/Needles</span>
                </label>
            </div>
            </div>

            <label className="block font-medium text-gray-800 mb-2">
            Please specify other specialty items not listed above
            </label>
            <textarea
            className="w-full p-3 border rounded-lg text-gray-700 mb-4"
            placeholder="List"
            />

            <div className="flex justify-between mt-6">
            <button className="text-mainRed font-semibold" onClick={prevStep}>
                Cancel account creation
            </button>
            <div>
                <button
                className="border border-mainRed text-mainRed px-6 py-3 rounded-lg font-semibold mr-4"
                onClick={prevStep}
                >
                Previous
                </button>
                <button
                className="bg-mainRed text-white px-6 py-3 rounded-lg font-semibold"
                onClick={nextStep}
                >
                Send invite link
                </button>
            </div>
            </div>
        </>
        )}
        {step === 10 && (
        <>
            <h2 className="text-xl font-bold mb-2">Create partner account</h2>
            <h3 className="font-semibold text-gray-700 mb-2">Finish</h3>
            <p className="mb-4">
            An email has been sent to the other party to finalize account creation. This account is currently pending.
            </p>
            <p className="mb-4">
            You can view the current status from the account management page.
            </p>
            <button
            className="bg-mainRed text-white px-6 py-3 rounded-lg font-semibold w-full"
            onClick={() => {
                router.push('/account_management');
            }}
            >
            Back to account management
            </button>
        </>
        )}
      </div>
    </div>
  );
}
