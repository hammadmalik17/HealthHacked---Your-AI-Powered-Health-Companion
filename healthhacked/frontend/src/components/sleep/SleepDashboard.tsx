import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, TrendingUp, Clock, Target, Battery, Settings } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SleepDebtMeter } from './SleepDebtMeter';
import { ProductivityWave } from './ProductivityWave';
import { SleepInsights } from './SleepInsights';
import { SleepSetupWizard } from './SleepSetupWizard';
import { sleepApi } from '../../services/sleepApi';
import toast from 'react-hot-toast';

interface SleepDashboardProps {
  className?: string;
}

export const SleepDashboard: React.FC<SleepDashboardProps> = ({ className }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🌙 Loading sleep dashboard...');
      
      const response = await sleepApi.getDashboard();
      console.log('📊 Sleep dashboard response:', response);
      
      if (response.data === null || !response.data) {
        console.log('⚠️ No sleep profile found, showing setup wizard');
        setShowSetup(true);
        setDashboardData(null);
      } else {
        console.log('✅ Sleep dashboard data loaded successfully');
        setDashboardData(response.data);
        setShowSetup(false);
      }
    } catch (error) {
      console.error('❌ Error loading sleep dashboard:', error);
      setError(error.message);
      // Show setup wizard on error too, in case it's a profile missing error
      setShowSetup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = () => {
    console.log('✅ Setup completed, reloading dashboard');
    setShowSetup(false);
    toast.success('Sleep profile created successfully!');
    loadDashboardData();
  };

  if (loading) {
      return (
        <motion.div
          className="min-h-screen bg-gradient-to-br from-slate-900 to-black flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="text-center"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.p
              className="mt-4 text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Loading your health dashboard...
            </motion.p>
          </motion.div>
        </motion.div>
      );
    }

  // Show setup wizard if no profile or explicitly requested
  if (showSetup || !dashboardData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={"bg-gradient-to-br from-slate-900 to-black"}
      >
        <Card className="p-6 text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Moon className="h-16 w-16 mx-auto mb-4 text-purple-400 mt-16" />
            <h3 className="text-xl font-semibold text-white mb-2">Welcome to Sleep Intelligence</h3>
            <p className="text-gray-400 mb-6">
              Track your sleep patterns and unlock personalized productivity insights
            </p>
            <Button 
              onClick={() => setShowSetup(true)}
              className="mb-4"
            >
              Get Started
            </Button>
          </motion.div>
        </Card>

        <AnimatePresence>
          {showSetup && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6"
            >
              <SleepSetupWizard onComplete={handleSetupComplete} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  const { currentProductivity, sleepDebt, productivity, insights, stats } = dashboardData;

  // Animation variants for cards
  const cardVariants = {
    hover: {
      scale: 1.03,
      boxShadow: "0 8px 32px 0 rgba(88, 101, 242, 0.2)",
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className={`space-y-6 bg-gradient-to-br from-slate-900 to-black p-5`}>
      {/* Header */}
      <Card className="p-6 mt-16">
        <div className="flex items-center justify-between ">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Sleep Intelligence</h2>
            <p className="text-gray-400">Your personalized sleep and productivity insights</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSetup(true)}
            className="flex items-center"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </Card>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  {[
    {
      icon: Battery,
      label: "Current Focus",
      value: `${currentProductivity ? Math.round(currentProductivity.productivity * 100) : 0}%`,
      color: currentProductivity?.productivity > 0.8 ? 'green' :
             currentProductivity?.productivity > 0.5 ? 'yellow' : 'red'
    },
    {
      icon: Moon,
      label: "Sleep Debt",
      value: `${sleepDebt?.toFixed(1) || '0.0'}h`,
      color: sleepDebt < 2 ? 'green' :
             sleepDebt < 5 ? 'yellow' : 'red'
    },
    {
      icon: Target,
      label: "Consistency",
      value: `${stats?.consistency || 0}%`,
      color: stats?.consistency > 80 ? 'green' :
             stats?.consistency > 60 ? 'yellow' : 'red'
    },
    {
      icon: TrendingUp,
      label: "Data Points",
      value: stats?.entriesLogged || 0,
      color: 'blue'
    }
  ].map((stat, index) => (
    <motion.div
      key={stat.label}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.1 }}
      variants={cardVariants}
      whileHover="hover"
      className="cursor-pointer"
    >
      <Card className={`p-4 hover:shadow-lg hover:shadow-${stat.color}-500/20 transition-shadow duration-300`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">{stat.label}</p>
            <motion.p
              className="text-2xl font-bold text-white"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              {stat.value}
            </motion.p>
          </div>
          <motion.div
            whileHover={{
              scale: 1.1,
              rotate: [0, -5, 5, 0]
            }}
            transition={{ duration: 0.3 }}
          >
            <stat.icon className={`h-8 w-8 text-${stat.color}-400`} />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  ))}
</div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Wave Chart */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-14">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Today's Productivity Curve</h3>
              <div className="flex items-center text-sm text-gray-400">
                <Clock className="h-4 w-4 mr-1" />
                Confidence: {Math.round((productivity?.confidence || 0) * 100)}%
              </div>
            </div>
            {productivity?.curve ? (
              <ProductivityWave 
                curve={productivity.curve} 
                recommendations={productivity.recommendations || []}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <p>Log some sleep data to see your productivity curve</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Sleep Debt Meter */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Sleep Debt Status</h3>
            <SleepDebtMeter 
              debt={sleepDebt || 0} 
              target={insights?.profile?.targetSleepHours || 8}
            />
            
            {/* Quick Recommendations */}
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-medium text-gray-300">Quick Actions</h4>
              {productivity?.recommendations?.slice(0, 3).map((rec, index) => (
                <motion.div
                  key={index}
                  className="p-3 bg-gray-800 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    {rec.timeSlot.start}:00 - {rec.timeSlot.end}:00
                  </p>
                  <p className="text-sm text-white mt-1">{rec.description}</p>
                </motion.div>
              )) || (
                <div className="text-center text-gray-400 py-4">
                  <p className="text-sm">Complete setup to see recommendations</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Sleep Insights */}
      {insights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <SleepInsights insights={insights} />
        </motion.div>
      )}

      {/* Setup Wizard Modal */}
      <AnimatePresence>
        {showSetup && dashboardData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSetup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl"
            >
              <SleepSetupWizard onComplete={handleSetupComplete} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

