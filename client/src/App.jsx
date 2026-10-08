import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ResendVerification from './pages/ResendVerification.jsx';
import Profile from './pages/Profile.jsx';
import EditProfile from './pages/EditProfile.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Feed from './pages/Feed.jsx';
import StoryDetails from './pages/StoryDetails.jsx';
import CreateStory from './pages/CreateStory.jsx';
import EditStory from './pages/EditStory.jsx';
import SavedStories from './pages/SavedStories.jsx';
import Trending from './pages/Trending.jsx';
import HashtagPage from './pages/HashtagPage.jsx';
import SearchResults from './pages/SearchResults.jsx';
import Followers from './pages/Followers.jsx';
import Following from './pages/Following.jsx';
import Notifications from './pages/Notifications.jsx';
import UserProfile from './pages/UserProfile.jsx';
import Skills from './pages/Skills.jsx';
import SkillDetails from './pages/SkillDetails.jsx';
import CreateSkill from './pages/CreateSkill.jsx';
import MentorRequests from './pages/MentorRequests.jsx';
import Marketplace from './pages/Marketplace.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import CreateProduct from './pages/CreateProduct.jsx';
import BusinessDirectory from './pages/BusinessDirectory.jsx';
import BusinessProfile from './pages/BusinessProfile.jsx';
import CreateBusiness from './pages/CreateBusiness.jsx';
import SavedCollections from './pages/SavedCollections.jsx';
import Inquiries from './pages/Inquiries.jsx';
import MentorDashboard from './pages/MentorDashboard.jsx';
import EntrepreneurDashboard from './pages/EntrepreneurDashboard.jsx';
import Communities from './pages/Communities.jsx';
import CreateCommunity from './pages/CreateCommunity.jsx';
import CommunityDetails from './pages/CommunityDetails.jsx';
import Messages from './pages/Messages.jsx';
import ChatWindow from './pages/ChatWindow.jsx';
import Events from './pages/Events.jsx';
import EventDetails from './pages/EventDetails.jsx';
import CreateEvent from './pages/CreateEvent.jsx';
import Opportunities from './pages/Opportunities.jsx';
import OpportunityDetails from './pages/OpportunityDetails.jsx';
import CreateOpportunity from './pages/CreateOpportunity.jsx';
import CollaborationHub from './pages/CollaborationHub.jsx';
import CollaborationDetails from './pages/CollaborationDetails.jsx';
import CreateCollaboration from './pages/CreateCollaboration.jsx';
import AIAssistant from './pages/AIAssistant.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminModeration from './pages/admin/AdminModeration.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import NotFound from './pages/NotFound.jsx';

const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicLayout>
            <Landing />
          </PublicLayout>
        }
      />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/resend-verification" element={<ResendVerification />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        }
      />

      {/* Part 2 — social network */}
      <Route path="/feed" element={<PublicLayout><Feed /></PublicLayout>} />
      <Route path="/trending" element={<PublicLayout><Trending /></PublicLayout>} />
      <Route path="/search" element={<PublicLayout><SearchResults /></PublicLayout>} />
      <Route path="/hashtag/:tag" element={<PublicLayout><HashtagPage /></PublicLayout>} />
      <Route path="/stories/:id" element={<PublicLayout><StoryDetails /></PublicLayout>} />
      <Route path="/u/:username" element={<PublicLayout><UserProfile /></PublicLayout>} />
      <Route path="/u/:username/followers" element={<PublicLayout><Followers /></PublicLayout>} />
      <Route path="/u/:username/following" element={<PublicLayout><Following /></PublicLayout>} />
      <Route
        path="/create-story"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <CreateStory />
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-story/:id"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <EditStory />
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/saved-stories"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <SavedStories />
            </PublicLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <PublicLayout>
              <Notifications />
            </PublicLayout>
          </ProtectedRoute>
        }
      />

      {/* Part 3 — skills, mentorship, marketplace, business directory */}
      <Route path="/skills" element={<PublicLayout><Skills /></PublicLayout>} />
      <Route path="/skills/:id" element={<PublicLayout><SkillDetails /></PublicLayout>} />
      <Route path="/marketplace" element={<PublicLayout><Marketplace /></PublicLayout>} />
      <Route path="/marketplace/:id" element={<PublicLayout><ProductDetails /></PublicLayout>} />
      <Route path="/businesses" element={<PublicLayout><BusinessDirectory /></PublicLayout>} />
      <Route path="/businesses/:id" element={<PublicLayout><BusinessProfile /></PublicLayout>} />
      <Route
        path="/skills/new"
        element={<ProtectedRoute><PublicLayout><CreateSkill /></PublicLayout></ProtectedRoute>}
      />
      <Route
        path="/marketplace/new"
        element={<ProtectedRoute><PublicLayout><CreateProduct /></PublicLayout></ProtectedRoute>}
      />
      <Route
        path="/businesses/new"
        element={<ProtectedRoute><PublicLayout><CreateBusiness /></PublicLayout></ProtectedRoute>}
      />
      <Route
        path="/mentor-requests"
        element={<ProtectedRoute><PublicLayout><MentorRequests /></PublicLayout></ProtectedRoute>}
      />
      <Route
        path="/inquiries"
        element={<ProtectedRoute><PublicLayout><Inquiries /></PublicLayout></ProtectedRoute>}
      />
      <Route
        path="/saved-collections"
        element={<ProtectedRoute><PublicLayout><SavedCollections /></PublicLayout></ProtectedRoute>}
      />
      <Route
        path="/dashboard/mentor"
        element={<ProtectedRoute><PublicLayout><MentorDashboard /></PublicLayout></ProtectedRoute>}
      />
      <Route
        path="/dashboard/entrepreneur"
        element={<ProtectedRoute><PublicLayout><EntrepreneurDashboard /></PublicLayout></ProtectedRoute>}
      />

      {/* Part 4 — communities, chat, opportunities, events, collaboration, AI */}
      <Route path="/communities" element={<PublicLayout><Communities /></PublicLayout>} />
      <Route path="/communities/:id" element={<PublicLayout><CommunityDetails /></PublicLayout>} />
      <Route path="/events" element={<PublicLayout><Events /></PublicLayout>} />
      <Route path="/events/:id" element={<PublicLayout><EventDetails /></PublicLayout>} />
      <Route path="/opportunities" element={<PublicLayout><Opportunities /></PublicLayout>} />
      <Route path="/opportunities/:id" element={<PublicLayout><OpportunityDetails /></PublicLayout>} />
      <Route path="/collaborations" element={<PublicLayout><CollaborationHub /></PublicLayout>} />
      <Route path="/collaborations/:id" element={<PublicLayout><CollaborationDetails /></PublicLayout>} />
      <Route
        path="/communities/new"
        element={<ProtectedRoute><PublicLayout><CreateCommunity /></PublicLayout></ProtectedRoute>}
      />
      <Route
        path="/events/new"
        element={<ProtectedRoute><PublicLayout><CreateEvent /></PublicLayout></ProtectedRoute>}
      />
      <Route
        path="/opportunities/new"
        element={<ProtectedRoute><PublicLayout><CreateOpportunity /></PublicLayout></ProtectedRoute>}
      />
      <Route
        path="/collaborations/new"
        element={<ProtectedRoute><PublicLayout><CreateCollaboration /></PublicLayout></ProtectedRoute>}
      />
      <Route
        path="/messages"
        element={<ProtectedRoute><PublicLayout><Messages /></PublicLayout></ProtectedRoute>}
      />
      <Route
        path="/messages/:id"
        element={<ProtectedRoute><PublicLayout><ChatWindow /></PublicLayout></ProtectedRoute>}
      />
      <Route
        path="/ai-assistant"
        element={<ProtectedRoute><PublicLayout><AIAssistant /></PublicLayout></ProtectedRoute>}
      />

      {/* Part 5 — admin panel (own layout, not wrapped in PublicLayout's landing navbar) */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute allowModerator><AdminUsers /></AdminRoute>} />
      <Route path="/admin/moderation" element={<AdminRoute allowModerator><AdminModeration /></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute allowModerator><AdminReports /></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
