import React from 'react';
import { Store, Package, Truck, DollarSign } from 'lucide-react';

export default function Marketplace() {
  const listings = [
    {
      id: 1,
      crop: 'Organic Tomatoes',
      quantity: '500 kg',
      price: '$2.5/kg',
      location: 'Green Valley Farm',
      delivery: 'Available',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80'
    },
    {
      id: 2,
      crop: 'Fresh Corn',
      quantity: '1000 kg',
      price: '$1.8/kg',
      location: 'Sunrise Farms',
      delivery: 'Pickup only',
      image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80'
    },
    {
      id: 3,
      crop: 'Premium Wheat',
      quantity: '2000 kg',
      price: '$1.2/kg',
      location: 'Golden Fields',
      delivery: 'Available',
      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center mb-8">
          <Store className="h-8 w-8 text-green-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Farmer's Marketplace</h1>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <img
                src={listing.image}
                alt={listing.crop}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{listing.crop}</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-gray-600">{listing.quantity}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
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
                <button className="mt-6 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                  Contact Seller
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}