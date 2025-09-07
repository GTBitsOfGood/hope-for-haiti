"use client";

import React, { useState } from "react";
import { PartnerDetails, Contact } from "@/schema/partnerDetails";

interface ContactInformationProps {
  isEditingOrg: boolean;
  setIsEditingOrg: React.Dispatch<React.SetStateAction<boolean>>;
  partnerDetails: PartnerDetails;
  onSave: (updatedDetails: Partial<PartnerDetails>) => Promise<void>;
  isSaving: boolean;
}

// Helper component for contact form fields
const ContactForm = ({
  contact,
  onContactChange,
  label,
  isEditing,
}: {
  contact: Contact;
  onContactChange: (contact: Contact) => void;
  label: string;
  isEditing: boolean;
}) => (
  <div className="col-span-2 border-t pt-4 mt-4">
    <h4 className="text-[16px] font-semibold text-[#22070B] mb-3">{label}</h4>
    <div className="grid grid-cols-2 gap-4">
      <p className="text-[14px] font-medium text-[#22070B]">First Name</p>
      {isEditing ? (
        <input
          type="text"
          value={contact.firstName}
          onChange={(e) =>
            onContactChange({ ...contact, firstName: e.target.value })
          }
          className="border p-1"
        />
      ) : (
        <p className="text-[14px] text-[#22070B]">{contact.firstName}</p>
      )}

      <p className="text-[14px] font-medium text-[#22070B]">Last Name</p>
      {isEditing ? (
        <input
          type="text"
          value={contact.lastName}
          onChange={(e) =>
            onContactChange({ ...contact, lastName: e.target.value })
          }
          className="border p-1"
        />
      ) : (
        <p className="text-[14px] text-[#22070B]">{contact.lastName}</p>
      )}

      <p className="text-[14px] font-medium text-[#22070B]">
        Organization Title
      </p>
      {isEditing ? (
        <input
          type="text"
          value={contact.orgTitle}
          onChange={(e) =>
            onContactChange({ ...contact, orgTitle: e.target.value })
          }
          className="border p-1"
        />
      ) : (
        <p className="text-[14px] text-[#22070B]">{contact.orgTitle}</p>
      )}

      <p className="text-[14px] font-medium text-[#22070B]">
        Primary Telephone
      </p>
      {isEditing ? (
        <input
          type="text"
          value={contact.primaryTelephone}
          onChange={(e) =>
            onContactChange({ ...contact, primaryTelephone: e.target.value })
          }
          className="border p-1"
        />
      ) : (
        <p className="text-[14px] text-[#22070B]">{contact.primaryTelephone}</p>
      )}

      <p className="text-[14px] font-medium text-[#22070B]">
        Secondary Telephone
      </p>
      {isEditing ? (
        <input
          type="text"
          value={contact.secondaryTelephone}
          onChange={(e) =>
            onContactChange({ ...contact, secondaryTelephone: e.target.value })
          }
          className="border p-1"
        />
      ) : (
        <p className="text-[14px] text-[#22070B]">
          {contact.secondaryTelephone}
        </p>
      )}

      <p className="text-[14px] font-medium text-[#22070B]">Email</p>
      {isEditing ? (
        <input
          type="email"
          value={contact.email}
          onChange={(e) =>
            onContactChange({ ...contact, email: e.target.value })
          }
          className="border p-1"
        />
      ) : (
        <p className="text-[14px] text-[#22070B]">{contact.email}</p>
      )}
    </div>
  </div>
);

export default function ContactInformation({
  isEditingOrg,
  setIsEditingOrg,
  partnerDetails,
  onSave,
  isSaving,
}: ContactInformationProps) {
  const [formData, setFormData] = useState({
    regionalContact: partnerDetails.regionalContact,
    medicalContact: partnerDetails.medicalContact,
    adminDirectorContact: partnerDetails.adminDirectorContact,
    pharmacyContact: partnerDetails.pharmacyContact,
    contactWhatsAppName: partnerDetails.contactWhatsAppName,
    contactWhatsAppNumber: partnerDetails.contactWhatsAppNumber,
  });

  const handleSave = async () => {
    await onSave(formData);
  };

  const handleCancel = () => {
    setFormData({
      regionalContact: partnerDetails.regionalContact,
      medicalContact: partnerDetails.medicalContact,
      adminDirectorContact: partnerDetails.adminDirectorContact,
      pharmacyContact: partnerDetails.pharmacyContact,
      contactWhatsAppName: partnerDetails.contactWhatsAppName,
      contactWhatsAppNumber: partnerDetails.contactWhatsAppNumber,
    });
    setIsEditingOrg(false);
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[20px] font-bold text-[#2774AE]">
          Contact information
        </h3>
        <div className="flex gap-2">
          {isEditingOrg && (
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="border border-gray-400 text-gray-600 px-4 py-2 rounded-[4px] font-semibold hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={isEditingOrg ? handleSave : () => setIsEditingOrg(true)}
            disabled={isSaving}
            className="border border-mainRed text-mainRed px-4 py-2 rounded-[4px] font-semibold hover:bg-mainRed/10 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : isEditingOrg ? "Save" : "Edit"}
          </button>
        </div>
      </div>

      <div className="mt-4 max-w-4xl">
        <ContactForm
          contact={formData.regionalContact}
          onContactChange={(contact) =>
            setFormData({ ...formData, regionalContact: contact })
          }
          label="Regional Contact"
          isEditing={isEditingOrg}
        />

        <ContactForm
          contact={formData.medicalContact}
          onContactChange={(contact) =>
            setFormData({ ...formData, medicalContact: contact })
          }
          label="Medical Contact"
          isEditing={isEditingOrg}
        />

        <ContactForm
          contact={formData.adminDirectorContact}
          onContactChange={(contact) =>
            setFormData({ ...formData, adminDirectorContact: contact })
          }
          label="Admin Director Contact"
          isEditing={isEditingOrg}
        />

        <ContactForm
          contact={formData.pharmacyContact}
          onContactChange={(contact) =>
            setFormData({ ...formData, pharmacyContact: contact })
          }
          label="Pharmacy Contact"
          isEditing={isEditingOrg}
        />

        <div className="col-span-2 border-t pt-4 mt-4">
          <h4 className="text-[16px] font-semibold text-[#22070B] mb-3">
            WhatsApp Contact
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <p className="text-[14px] font-medium text-[#22070B]">
              WhatsApp Contact Name
            </p>
            {isEditingOrg ? (
              <input
                type="text"
                value={formData.contactWhatsAppName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactWhatsAppName: e.target.value,
                  })
                }
                className="border p-1"
              />
            ) : (
              <p className="text-[14px] text-[#22070B]">
                {partnerDetails.contactWhatsAppName}
              </p>
            )}

            <p className="text-[14px] font-medium text-[#22070B]">
              WhatsApp Number
            </p>
            {isEditingOrg ? (
              <input
                type="text"
                value={formData.contactWhatsAppNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactWhatsAppNumber: e.target.value,
                  })
                }
                className="border p-1"
              />
            ) : (
              <p className="text-[14px] text-[#22070B]">
                {partnerDetails.contactWhatsAppNumber}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
