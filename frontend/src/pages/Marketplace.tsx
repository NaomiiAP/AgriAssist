import React, { useState, useEffect } from "react";
import { Store, Package, Truck, IndianRupee, PlusCircle, X, Search } from "lucide-react";
import axios from 'axios';

interface Crop {
  id: number;
  crop: string;
  quantity: string;
  price: string;
  location: string;
  delivery: string;
  image: string;
}

interface MarketplaceItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  seller: string;
  created_at: string;
}

interface ApiResponse {
  status: string;
  items?: MarketplaceItem[];
  item?: MarketplaceItem;
  error?: string;
  message?: string;
}

export default function Marketplace() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editListing, setEditListing] = useState<Crop | null>(null);
  const [newCrop, setNewCrop] = useState<Partial<Crop>>({
    crop: '',
    quantity: '',
    price: '',
    location: '',
    delivery: 'Available',
    image: ''
  });

  const [imageData, setImageData] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      const response = await axios.get<ApiResponse>(`${import.meta.env.VITE_BACKEND_URL}/marketplace/items`);
      
      if (response.data.items) {
        const transformedCrops = response.data.items.map((item) => ({
          id: item.id,
          crop: item.name,
          quantity: "1 unit",
          price: `₹${item.price}`,
          location: item.seller || "Anonymous",
          delivery: "Available",
          image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80"
        }));
        setCrops(transformedCrops);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching crops:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch marketplace items: ${errorMessage}`);
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const handleNewCropChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCrop(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageData(reader.result as string);
        setNewCrop(prev => ({
          ...prev,
          image: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addCrop = async () => {
    if (!newCrop.crop || !newCrop.quantity || !newCrop.price || !newCrop.location) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Extract numeric value from price string (remove ₹ symbol and any non-numeric characters)
      const priceValue = parseFloat(newCrop.price.replace(/[^0-9.]/g, ''));

      const backendData = {
        name: newCrop.crop,
        description: `${newCrop.quantity} available at ${newCrop.location}`,
        price: priceValue,
        category: "crops",
        seller: newCrop.location
      };

      const response = await axios.post<ApiResponse>(`${import.meta.env.VITE_BACKEND_URL}/marketplace/items`, backendData);
      
      if (response.data.status === 'success' && response.data.item) {
        const newItem = response.data.item;
        const transformedCrop = {
          id: newItem.id,
          crop: newItem.name,
          quantity: newCrop.quantity,
          price: `₹${newItem.price}`,
          location: newItem.seller,
          delivery: newCrop.delivery || "Available",
          image: newCrop.image || "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80"
        };
        
        setCrops(prev => [...prev, transformedCrop]);
        resetForm();
      } else {
        throw new Error('Failed to add crop');
      }
    } catch (err) {
      console.error('Error adding crop:', err);
      setError(err instanceof Error ? err.message : "Failed to add crop");
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setImageData(null);
    setNewCrop({
      crop: '',
      quantity: '',
      price: '',
      location: '',
      delivery: 'Available',
      image: ''
    });
  };

  const handleEditChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editListing) return;
    setEditListing({ ...editListing, [event.target.name]: event.target.value });
  };

  const saveEdit = async () => {
    if (!editListing) return;

    try {
      // Extract numeric value from price string (remove ₹ symbol and any non-numeric characters)
      const priceValue = parseFloat(editListing.price.replace(/[^0-9.]/g, ''));

      const backendData = {
        name: editListing.crop,
        description: `${editListing.quantity} available at ${editListing.location}`,
        price: priceValue,
        category: "crops",
        seller: editListing.location
      };

      console.log('Sending update request:', backendData);
      const response = await axios.put<ApiResponse>(`${import.meta.env.VITE_BACKEND_URL}/marketplace/items/${editListing.id}`, backendData);
      
      if (response.data.status === 'success' && response.data.item) {
        // Update the local state with the edited listing
        setCrops(crops.map((crop) => 
          crop.id === editListing.id 
            ? {
                ...crop,
                price: `₹${priceValue}`,
                quantity: editListing.quantity
              }
            : crop
        ));
        setEditListing(null);
      } else {
        throw new Error(response.data.message || 'Failed to update crop details');
      }
    } catch (err) {
      console.error('Error updating crop:', err);
      setError(err instanceof Error ? err.message : "Failed to update crop details");
    }
  };

  const deleteCrop = async (id: number) => {
    try {
      const response = await axios.delete<ApiResponse>(`${import.meta.env.VITE_BACKEND_URL}/marketplace/items/${id}`);
      
      if (response.data.status === 'success') {
        // Remove the crop from the local state
        setCrops(prev => prev.filter(crop => crop.id !== id));
      } else {
        throw new Error(response.data.message || 'Failed to delete crop');
      }
    } catch (err) {
      console.error('Error deleting crop:', err);
      setError(err instanceof Error ? err.message : "Failed to delete crop");
    }
  };

  const filteredCrops = crops.filter((crop) =>
    crop.crop.toLowerCase().includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex items-center">
            <Store className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Farmer's Marketplace</h1>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search crops..."
                value={searchQuery}
                onChange={handleSearch}
                className="border rounded-lg px-4 py-2 pr-10 w-full md:w-72"
              />
              <Search className="absolute right-3 top-3 h-5 w-5 text-gray-500" />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors w-full md:w-auto"
            >
              <PlusCircle className="h-5 w-5 mr-2" /> Add Crop
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative">
                <img src={listing.image} alt={listing.crop} className="w-full h-48 object-cover" />
                <button
                  onClick={() => deleteCrop(listing.id)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{listing.crop}</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-gray-600">{listing.quantity}</span>
                  </div>
                  <div className="flex items-center">
                    <IndianRupee className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-gray-600">{listing.price}</span>
                  </div>
                  <div className="flex items-center">
                    <Store className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-gray-600">{listing.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Truck className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-gray-600">{listing.delivery}</span>
                  </div>
                </div>
                <button
                  className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => setEditListing(listing)}
                >
                  Edit
                </button>

                {editListing && editListing.id === listing.id && (
                  <div className="mt-4 space-y-2">
                    <input
                      type="text"
                      name="price"
                      value={editListing.price}
                      onChange={handleEditChange}
                      className="border p-2 rounded w-full"
                      placeholder="New Price (e.g., ₹200/kg)"
                    />
                    <input
                      type="text"
                      name="quantity"
                      value={editListing.quantity}
                      onChange={handleEditChange}
                      className="border p-2 rounded w-full"
                      placeholder="New Quantity (e.g., 500 kg)"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={saveEdit}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditListing(null)}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Crop Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg w-full max-w-sm relative">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Add New Crop</h2>
                <button 
                  onClick={resetForm} 
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Crop Name *</label>
                  <input
                    type="text"
                    name="crop"
                    value={newCrop.crop}
                    onChange={handleNewCropChange}
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="e.g., Organic Tomatoes"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="text"
                    name="quantity"
                    value={newCrop.quantity}
                    onChange={handleNewCropChange}
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="e.g., 500 kg"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <input
                    type="text"
                    name="price"
                    value={newCrop.price}
                    onChange={handleNewCropChange}
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="e.g., ₹200/kg"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={newCrop.location}
                    onChange={handleNewCropChange}
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="e.g., Green Valley Farm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Option</label>
                  <select
                    name="delivery"
                    value={newCrop.delivery}
                    onChange={handleNewCropChange}
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <option value="Available">Available</option>
                    <option value="Pickup only">Pickup only</option>
                    <option value="Delivery within 50km">Delivery within 50km</option>
                    <option value="Free delivery above ₹5000">Free delivery above ₹5000</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                  {imageData && (
                    <div className="mt-2">
                      <img src={imageData} alt="Preview" className="h-24 object-cover rounded" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex space-x-3">
                <button
                  onClick={addCrop}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Crop
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}