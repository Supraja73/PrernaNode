const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const cloudinary = require('../config/cloudinary');
const { notify } = require('../services/notificationService');

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 12, 30);
  return { page, limit, skip: (page - 1) * limit };
};

const singleFileFromReq = (req, field) => {
  const f = req.files?.[field]?.[0];
  return f ? { url: f.path, publicId: f.filename } : undefined;
};
const filesFromReq = (req, field) => (req.files?.[field] || []).map((f) => ({ url: f.path, publicId: f.filename }));

const createEvent = asyncHandler(async (req, res) => {
  const body = req.body;
  const speakers = body.speakers ? JSON.parse(body.speakers) : [];
  const schedule = body.schedule ? JSON.parse(body.schedule) : [];

  const event = await Event.create({
    organizer: req.user._id,
    community: body.communityId || null,
    title: body.title,
    description: body.description,
    banner: singleFileFromReq(req, 'banner'),
    mode: body.mode || 'Online',
    venue: body.venue || '',
    onlineLink: body.onlineLink || '',
    date: body.date,
    time: body.time,
    seats: body.seats || 0,
    speakers,
    schedule,
    gallery: filesFromReq(req, 'gallery'),
  });

  res.status(201).json({ success: true, data: event });
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  if (String(event.organizer) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only edit your own events');
  }
  const body = req.body;
  ['title', 'description', 'mode', 'venue', 'onlineLink', 'date', 'time', 'seats', 'status', 'certificatesReady'].forEach((f) => {
    if (body[f] !== undefined) event[f] = body[f];
  });
  if (body.speakers !== undefined) event.speakers = typeof body.speakers === 'string' ? JSON.parse(body.speakers) : body.speakers;
  if (body.schedule !== undefined) event.schedule = typeof body.schedule === 'string' ? JSON.parse(body.schedule) : body.schedule;
  if (req.files?.banner?.[0]) {
    if (event.banner?.publicId) await cloudinary.uploader.destroy(event.banner.publicId).catch(() => {});
    event.banner = singleFileFromReq(req, 'banner');
  }
  if (req.files?.gallery?.length) {
    event.gallery = [...event.gallery, ...filesFromReq(req, 'gallery')];
  }
  await event.save();
  res.json({ success: true, data: event });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  if (String(event.organizer) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only delete your own events');
  }
  const assets = [event.banner, ...event.gallery].filter((a) => a?.publicId);
  await Promise.all(assets.map((a) => cloudinary.uploader.destroy(a.publicId).catch(() => {})));
  await event.deleteOne();
  res.json({ success: true, message: 'Event deleted' });
});

const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer', 'name username avatar').populate('community', 'name logo');
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  res.json({ success: true, data: event });
});

const listEvents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const q = req.query;
  const filter = { hidden: { $ne: true } };
  if (q.mode) filter.mode = q.mode;
  if (q.status) filter.status = q.status;
  if (q.q) filter.$text = { $search: q.q };
  if (q.upcoming === 'true') filter.date = { $gte: new Date() };

  const [events, total] = await Promise.all([
    Event.find(filter).sort({ date: 1 }).skip(skip).limit(limit).populate('organizer', 'name username avatar'),
    Event.countDocuments(filter),
  ]);
  res.json({ success: true, data: events, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// @desc    RSVP going / interested (toggle)
// @route   POST /api/events/:id/rsvp
// @access  Private
const rsvp = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  const { status } = req.body; // 'going' | 'interested'
  const field = status === 'going' ? 'rsvpGoing' : 'rsvpInterested';
  const otherField = status === 'going' ? 'rsvpInterested' : 'rsvpGoing';

  if (status === 'going' && event.seats > 0 && event.rsvpGoing.length >= event.seats && !event.rsvpGoing.some((u) => String(u) === String(req.user._id))) {
    res.status(400);
    throw new Error('This event is fully booked');
  }

  event[otherField] = event[otherField].filter((u) => String(u) !== String(req.user._id));
  const already = event[field].some((u) => String(u) === String(req.user._id));
  if (already) {
    event[field] = event[field].filter((u) => String(u) !== String(req.user._id));
  } else {
    event[field].push(req.user._id);
    await notify({ recipient: event.organizer, actor: req.user._id, type: 'event_rsvp', message: `${req.user.name} RSVP'd ${status} to ${event.title}`, refModel: 'Event', refId: event._id });
  }
  await event.save();

  res.json({ success: true, data: { rsvpGoing: event.rsvpGoing.length, rsvpInterested: event.rsvpInterested.length, yourStatus: already ? null : status } });
});

// @desc    Leave feedback/rating after an event
// @route   POST /api/events/:id/feedback
// @access  Private
const leaveFeedback = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }
  event.feedback = event.feedback.filter((f) => String(f.user) !== String(req.user._id));
  event.feedback.push({ user: req.user._id, rating: req.body.rating, comment: req.body.comment });
  await event.save();
  res.json({ success: true, message: 'Feedback submitted' });
});

module.exports = { createEvent, updateEvent, deleteEvent, getEvent, listEvents, rsvp, leaveFeedback };
