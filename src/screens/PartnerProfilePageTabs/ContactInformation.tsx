"use client";

import React from "react";

interface ContactData {
  regionalContact: string;
  medicalContact: string;
  adminDirector: string;
  pharmacy: string;
  whatsAppContact: string;
  whatsAppNumber: string;
}

interface ContactInformationProps {
  isEditingOrg: boolean;
  setIsEditingOrg: React.Dispatch<React.SetStateAction<boolean>>;
  contactData: ContactData;
  setContactData: React.Dispatch<React.SetStateAction<ContactData>>;
}

export default function ContactInformation({
  isEditingOrg,
  setIsEditingOrg,
  contactData,
  setContactData,
}: ContactInformationProps) {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-bold text-[#2774AE]">
          Contact information
        </h3>
        <button
          onClick={() => setIsEditingOrg(!isEditingOrg)}
          className="border border-mainRed text-mainRed px-4 py-2 rounded-[4px] font-semibold hover:bg-mainRed/10"
        >
          {isEditingOrg ? "Save" : "Edit"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 max-w-xl">
        <p className="text-[18px] font-semibold text-[#22070B]">
          Regional Contact
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={contactData.regionalContact}
            onChange={(e) =>
              setContactData({
                ...contactData,
                regionalContact: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {contactData.regionalContact}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Medical Contact
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={contactData.medicalContact}
            onChange={(e) =>
              setContactData({ ...contactData, medicalContact: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {contactData.medicalContact}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          Admin Director
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={contactData.adminDirector}
            onChange={(e) =>
              setContactData({ ...contactData, adminDirector: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {contactData.adminDirector}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">Pharmacy</p>
        {isEditingOrg ? (
          <input
            type="text"
            value={contactData.pharmacy}
            onChange={(e) =>
              setContactData({ ...contactData, pharmacy: e.target.value })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">{contactData.pharmacy}</p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          WhatsApp contact
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={contactData.whatsAppContact}
            onChange={(e) =>
              setContactData({
                ...contactData,
                whatsAppContact: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {contactData.whatsAppContact}
          </p>
        )}

        <p className="text-[18px] font-semibold text-[#22070B]">
          WhatsApp number
        </p>
        {isEditingOrg ? (
          <input
            type="text"
            value={contactData.whatsAppContact}
            onChange={(e) =>
              setContactData({
                ...contactData,
                whatsAppContact: e.target.value,
              })
            }
            className="border p-1"
          />
        ) : (
          <p className="text-[16px] text-[#22070B]">
            {contactData.whatsAppContact}
          </p>
        )}
      </div>
    </div>
  );
}
