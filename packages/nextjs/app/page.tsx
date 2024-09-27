"use client";

import Link from "next/link";
import type { NextPage } from "next";
import Image from "next/image";

const Home: NextPage = () => {
  return (
    <main className="container mx-auto px-6 py-8">
      <h1 className="text-4xl font-bold text-center mb-12">Welcome to DecentralFreelance</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div className="bg-white p-8 rounded-xl shadow-lg transition-transform hover:scale-105">
          <Image src="/dev.jpeg" alt="Developer" width={400} height={300} className="w-full h-48 object-cover mb-6 rounded-lg" />
          <h2 className="text-3xl font-semibold mb-4 text-indigo-600">For Developers</h2>
          <p className="mb-6 text-gray-600">Showcase your skills, build your portfolio, and find exciting projects that match your expertise. Join our community of talented developers and take your career to the next level.</p>
          <Link href="/developers" className="bg-indigo-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-indigo-600 transition-colors">
            Get Started as a Developer
          </Link>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-lg transition-transform hover:scale-105">
          <Image src="/client.jpg" alt="Client" width={400} height={300} className="w-full h-48 object-cover mb-6 rounded-lg" />
          <h2 className="text-3xl font-semibold mb-4 text-emerald-600">For Clients</h2>
          <p className="mb-6 text-gray-600">Post your projects and connect with skilled developers who can bring your ideas to life. From web development to blockchain solutions, find the perfect match for your project needs.</p>
          <Link href="/clients" className="bg-emerald-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-emerald-600 transition-colors">
            Post a Project
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-8 rounded-xl shadow-lg text-white">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
            <h2 className="text-3xl font-semibold mb-4">Staking Rewards</h2>
            <p className="mb-6">Stake your tokens to access premium features, boost your profile visibility, and earn passive rewards. The more you stake, the more benefits you unlock!</p>
            <Link href="/staking" className="bg-white text-purple-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
              Start Staking
            </Link>
          </div>
          <div className="md:w-1/3">
            <Image src="/stake.png" alt="Staking" width={300} height={300} className="w-full rounded-lg shadow-md" />
          </div>
        </div>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-3xl font-semibold mb-6">Why Choose DecentralFreelance?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Image src="/decentralized-icon.jpg" alt="Decentralized" width={80} height={80} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Fully Decentralized</h3>
            <p className="text-gray-600">Enjoy the benefits of a trustless, transparent platform powered by blockchain technology.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Image src="/secure-icon.jpg" alt="Secure" width={80} height={80} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Secure Transactions</h3>
            <p className="text-gray-600">All payments and contracts are secured by smart contracts on the StarkNet network.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Image src="/reward-icon.jpg" alt="Rewarding" width={80} height={80} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Rewarding Ecosystem</h3>
            <p className="text-gray-600">Earn rewards through staking, completing projects, and contributing to the platform's growth.</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;