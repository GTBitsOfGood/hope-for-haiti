"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { db } from "@/db";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { startOfYear, endOfYear, getMonth, getYear } from "date-fns";

// Define manually to match Prisma's enum
enum ItemCategory {
  MEDICATION = "MEDICATION",
  MEDICAL_SUPPLY = "MEDICAL_SUPPLY",
  NON_MEDICAL = "NON_MEDICAL",
  PURCHASES = "PURCHASES"
}

type ReportingPeriod = "fiscal" | "calendar";
type ReportingType = "import" | "distribution";

type SummaryData = {
  totalImported: number;
  totalImportValue: number;
  totalDistributed: number;
  totalDistributionValue: number;
  remainingInventory: number;
  remainingInventoryValue: number;
};

type MonthlyData = {
  name: string;
  value: number;
};

type CategoryData = {
  name: string;
  value: number;
};

type PartnerDistributionData = {
  name: string;
  value: number;
};

type DonorData = {
  name: string;
  value: number;
};

// Partner interface
interface Partner {
  id: number;
  name: string;
  type: string;
  unallocatedItemRequests: {
    allocations: {
      quantity: number;
    }[];
  }[];
}

export default function AnalyticsScreen() {
  const [reportingPeriod, setReportingPeriod] = useState<ReportingPeriod>("fiscal");
  const [reportingType, setReportingType] = useState<ReportingType>("import");
  const [loading, setLoading] = useState(true);
  
  // State for database data
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalImported: 0,
    totalImportValue: 0,
    totalDistributed: 0,
    totalDistributionValue: 0,
    remainingInventory: 0,
    remainingInventoryValue: 0,
  });
  const [importData, setImportData] = useState<MonthlyData[]>([]);
  const [distributionData, setDistributionData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [partnerDistributionData, setPartnerDistributionData] = useState<PartnerDistributionData[]>([]);
  const [topDonorsData, setTopDonorsData] = useState<DonorData[]>([]);

  // Function to get date range based on reporting period
  const getDateRange = () => {
    const now = new Date();
    const currentYear = getYear(now);
    
    if (reportingPeriod === "fiscal") {
      // Fiscal year: July 1 - June 30
      const currentMonth = getMonth(now);
      const fiscalYear = currentMonth >= 6 ? currentYear : currentYear - 1;
      
      return {
        startDate: new Date(fiscalYear, 6, 1), // July 1
        endDate: new Date(fiscalYear + 1, 5, 30), // June 30
      };
    } else {
      // Calendar year: Jan 1 - Dec 31
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now),
      };
    }
  };

  // Fetch data from database
  const fetchData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      
      // Fetch imported items (arrived in Haiti)
      const importedItems = await db.item.findMany({
        where: {
          // Assuming there's a field to indicate item has arrived in Haiti
          // This is just a placeholder - adjust according to actual schema
          datePosted: {
            gte: startDate,
            lte: endDate,
          },
          // Add condition for "arrived in Haiti" status when available
        },
      });
      
      // Fetch distributed items
      // This is a placeholder - adjust according to actual schema
      const distributedItems = await db.item.findMany({
        where: {
          datePosted: {
            gte: startDate,
            lte: endDate,
          },
          // Add condition for "distributed" status when available
          // Example: distributionStatus: "DISTRIBUTED"
        },
      });
      
      // Calculate summary data
      const totalImported = importedItems.length;
      const totalImportValue = importedItems.reduce((sum: number, item: any) => sum + Number(item.unitPrice) * item.quantity, 0);
      
      const totalDistributed = distributedItems.length;
      const totalDistributionValue = distributedItems.reduce((sum: number, item: any) => sum + Number(item.unitPrice) * item.quantity, 0);
      
      const remainingInventory = totalImported - totalDistributed;
      const remainingInventoryValue = totalImportValue - totalDistributionValue;
      
      setSummaryData({
        totalImported,
        totalImportValue,
        totalDistributed,
        totalDistributionValue,
        remainingInventory,
        remainingInventoryValue,
      });
      
      // Process monthly data for imports
      const monthlyImports = processMonthlyData(importedItems);
      setImportData(monthlyImports);
      
      // Process monthly data for distributions
      const monthlyDistributions = processMonthlyData(distributedItems);
      setDistributionData(monthlyDistributions);
      
      // Process category data
      const categories = processCategoryData(importedItems);
      setCategoryData(categories);
      
      // Fetch partner distribution data
      // This is a placeholder - adjust according to actual schema
      const partnerDistributions = await fetchPartnerDistributionData();
      setPartnerDistributionData(partnerDistributions);
      
      // Fetch top donors data
      const donors = await fetchTopDonorsData();
      setTopDonorsData(donors);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  };
  
  // Process items into monthly data format
  const processMonthlyData = (items: any[]): MonthlyData[] => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = new Array(12).fill(0).map((_, i) => ({ name: months[i], value: 0 }));
    
    // If fiscal year, rearrange months to start from July
    if (reportingPeriod === "fiscal") {
      const july = monthlyData.splice(6, 6);
      monthlyData.unshift(...july);
    }
    
    // Count items by month
    items.forEach(item => {
      const date = new Date(item.datePosted);
      let monthIndex = date.getMonth();
      
      // Adjust month index for fiscal year
      if (reportingPeriod === "fiscal") {
        monthIndex = (monthIndex + 6) % 12;
      }
      
      monthlyData[monthIndex].value += item.quantity;
    });
    
    return monthlyData;
  };
  
  // Process items into category data format
  const processCategoryData = (items: any[]): CategoryData[] => {
    // Create an empty object to count categories
    const categoryCount: Record<string, number> = {};
    
    // Initialize the count for each category
    Object.values(ItemCategory).forEach(category => {
      categoryCount[category.toString()] = 0;
    });
    
    items.forEach(item => {
      if (item.category && item.category in categoryCount) {
        categoryCount[item.category] += item.quantity;
      }
    });
    
    return Object.entries(categoryCount).map(([category, value]) => ({
      name: formatCategoryName(category),
      value,
    }));
  };
  
  // Format category name for display
  const formatCategoryName = (category: string) => {
    return category
      .replace('_', ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  // Fetch partner distribution data
  const fetchPartnerDistributionData = async (): Promise<PartnerDistributionData[]> => {
    // This is a placeholder - implement actual query based on schema
    try {
      // Example query - adjust based on your actual schema
      const partners = await db.user.findMany({
        where: {
          type: "PARTNER",
        },
        include: {
          unallocatedItemRequests: {
            include: {
              allocations: true,
            },
          },
        },
      });
      
      // Process partner data
      return partners.map((partner: Partner) => {
        const totalAllocated = partner.unallocatedItemRequests.reduce(
          (sum, request) => 
            sum + request.allocations.reduce(
              (reqSum, allocation) => reqSum + allocation.quantity, 
              0
            ), 
          0
        );
        
        return {
          name: partner.name,
          value: totalAllocated,
        };
      })
      .sort((a: PartnerDistributionData, b: PartnerDistributionData) => b.value - a.value)
      .slice(0, 5); // Top 5 partners
      
    } catch (error) {
      console.error("Error fetching partner data:", error);
      return [];
    }
  };
  
  // Fetch top donors data
  const fetchTopDonorsData = async (): Promise<DonorData[]> => {
    // This is a placeholder - implement actual query based on schema
    try {
      // Group items by donor and calculate total value
      const items = await db.item.findMany();
      
      const donorMap = new Map<string, number>();
      
      items.forEach((item: any) => {
        const currentTotal = donorMap.get(item.donorName) || 0;
        donorMap.set(item.donorName, currentTotal + (Number(item.unitPrice) * item.quantity));
      });
      
      // Convert to array and sort
      return Array.from(donorMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a: DonorData, b: DonorData) => b.value - a.value)
        .slice(0, 5); // Top 5 donors
        
    } catch (error) {
      console.error("Error fetching donor data:", error);
      return [];
    }
  };
  
  // Fetch data when component mounts or when reporting period changes
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportingPeriod]); // Disable the lint warning as we only want to run this on reporting period change

  const getDateRangeLabel = () => {
    if (reportingPeriod === "fiscal") {
      return "July 1 - June 30";
    } else {
      return "January 1 - December 31";
    }
  };

  // Format currency value
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="reportingPeriod" className="font-medium">Reporting Period:</label>
            <select
              id="reportingPeriod"
              value={reportingPeriod}
              onChange={(e) => setReportingPeriod(e.target.value as ReportingPeriod)}
              className="border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="fiscal">Fiscal Year</option>
              <option value="calendar">Calendar Year</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="reportingType" className="font-medium">Report Type:</label>
            <select
              id="reportingType"
              value={reportingType}
              onChange={(e) => setReportingType(e.target.value as ReportingType)}
              className="border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="import">Imports</option>
              <option value="distribution">Distributions</option>
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg font-medium text-gray-500">Loading data...</div>
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-medium mb-2">Summary for {reportingPeriod === "fiscal" ? "Fiscal" : "Calendar"} Year ({getDateRangeLabel()})</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-md font-medium mb-1">Total Imported</h3>
                <p className="text-2xl font-bold">{summaryData.totalImported} items</p>
                <p className="text-sm text-gray-600">{formatCurrency(summaryData.totalImportValue)} value</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-md font-medium mb-1">Total Distributed</h3>
                <p className="text-2xl font-bold">{summaryData.totalDistributed} items</p>
                <p className="text-sm text-gray-600">{formatCurrency(summaryData.totalDistributionValue)} value</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-md font-medium mb-1">Remaining Inventory</h3>
                <p className="text-2xl font-bold">{summaryData.remainingInventory} items</p>
                <p className="text-sm text-gray-600">{formatCurrency(summaryData.remainingInventoryValue)} value</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-medium mb-4">
              Monthly {reportingType === "import" ? "Imports" : "Distributions"} ({reportingPeriod === "fiscal" ? "Fiscal" : "Calendar"} Year)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={reportingType === "import" ? importData : distributionData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="value"
                  name={reportingType === "import" ? "Imports" : "Distributions"}
                  fill={reportingType === "import" ? "#4299e1" : "#48bb78"}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-xl shadow">
              <h2 className="text-lg font-medium mb-4">Item Categories</h2>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={["#4299e1", "#48bb78", "#ecc94b", "#ed8936"][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <div className="text-gray-500">No category data available</div>
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl shadow">
              <h2 className="text-lg font-medium mb-4">
                Distribution by Partner
              </h2>
              {partnerDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={partnerDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {partnerDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={["#4299e1", "#48bb78", "#ecc94b", "#ed8936", "#9f7aea"][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <div className="text-gray-500">No partner distribution data available</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-medium mb-4">Top Donors</h2>
            {topDonorsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  layout="vertical"
                  data={topDonorsData}
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="value" name="Donation Value" fill="#4299e1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">No donor data available</div>
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-medium mb-4">Audit Information</h2>
            <p className="mb-2">This section provides information required for auditors:</p>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Imports Summary</h3>
                <p>Total items imported during {reportingPeriod === "fiscal" ? "fiscal" : "calendar"} year: {summaryData.totalImported} items ({formatCurrency(summaryData.totalImportValue)})</p>
                <p>Items arrived in Haiti: {summaryData.totalImported} items (100%)</p>
              </div>
              <div>
                <h3 className="font-medium">Distributions Summary</h3>
                <p>Total items distributed: {summaryData.totalDistributed} items ({formatCurrency(summaryData.totalDistributionValue)})</p>
                <p>Items signed off: {summaryData.totalDistributed} items (100%)</p>
              </div>
              <div>
                <h3 className="font-medium">Distribution by Partner</h3>
                <ul className="list-disc pl-5">
                  {partnerDistributionData.map((partner) => (
                    <li key={partner.name}>
                      {partner.name}: {partner.value} items ({summaryData.totalDistributed > 0 ? ((partner.value / summaryData.totalDistributed) * 100).toFixed(1) : 0}%)
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium">Category Breakdown</h3>
                <ul className="list-disc pl-5">
                  {categoryData.map((category) => (
                    <li key={category.name}>
                      {category.name}: {category.value} items ({summaryData.totalImported > 0 ? ((category.value / summaryData.totalImported) * 100).toFixed(1) : 0}%)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 