import React, { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../lib/api';
import type { Assignment } from '../types/courseView';

interface AssignmentsProps {
  courseId?: number;
  courseUrl?: string;
  playlistAssignments?: Assignment[];
}

interface AssignmentWithSubmission extends Assignment {
  submitted?: boolean;
  submitted_at?: string;
  section_url?: string;
}

// Helper function to get cached submission status from localStorage
const getCachedSubmissionStatus = (courseId: number, assignmentId: number): boolean => {
  try {
    const key = `assignment_submitted_${courseId}_${assignmentId}`;
    const cached = localStorage.getItem(key);
    return cached === 'true';
  } catch {
    return false;
  }
};

// Helper function to cache submission status in localStorage
const setCachedSubmissionStatus = (courseId: number, assignmentId: number, submitted: boolean) => {
  try {
    const key = `assignment_submitted_${courseId}_${assignmentId}`;
    localStorage.setItem(key, submitted.toString());
  } catch {
    console.error('Failed to cache submission status');
  }
};

const Assignments: React.FC<AssignmentsProps> = ({ courseId, courseUrl, playlistAssignments }) => {
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ [key: number]: 'idle' | 'success' | 'error' }>({});

  useEffect(() => {
    const fetchAssignments = async () => {
      if (playlistAssignments) {
        const assignmentsWithCache = playlistAssignments.map((a: AssignmentWithSubmission) => ({
          ...a,
          submitted: a.submitted || (a.course_id ? getCachedSubmissionStatus(a.course_id, a.id) : false)
        }));
        setAssignments(assignmentsWithCache);
        setLoading(false);
        return;
      }

      if (!courseId || !courseUrl) {
        setLoading(false);
        return;
      }


      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/courses/${courseId}/${courseUrl}/assignments`);
        const data = response.data;

        if (data.success) {
          const assignmentsList = data.assignments || data.optional_assignments || [];

          // Apply cached submission status as fallback if API doesn't have it
          const assignmentsWithCache = assignmentsList.map((a: AssignmentWithSubmission) => ({
            ...a,
            submitted: a.submitted || getCachedSubmissionStatus(courseId!, a.id)
          }));

          setAssignments(assignmentsWithCache);
        } else {
          setError('Failed to load assignments');
        }
      } catch (err: any) {
        console.error('Failed to fetch assignments:', err);
        if (err.response?.status === 404) {
          setAssignments([]);
        } else {
          setError('Failed to load assignments. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [courseId, courseUrl]);




  //select file and submit immediately
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, assignmentId: number, sectionUrl?: string) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      handleSubmitAssignment(assignmentId, file, sectionUrl);
    }
  };




  //submit assignment function
  const handleSubmitAssignment = async (assignmentId: number, file: File, sectionUrl?: string) => {
    // Find assignment to get its course info if props are missing
    const assignment = assignments.find(a => a.id === assignmentId);
    const effectiveCourseId = courseId || assignment?.course_id;
    const effectiveCourseUrl = courseUrl || assignment?.course_url;

    if (!effectiveCourseId || !effectiveCourseUrl) {
      console.error('Missing course ID or URL for submission');
      return;
    }

    setUploading(assignmentId);
    setUploadStatus(prev => ({ ...prev, [assignmentId]: 'idle' }));

    try {
      const formData = new FormData();
      formData.append('submitted_file', file);

      const section = sectionUrl || 'section-1';

      const response = await api.post(
        `/courses/${effectiveCourseId}/${effectiveCourseUrl}/${section}/${assignmentId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const data = response.data;

      if (data.success) {
        setUploadStatus(prev => ({ ...prev, [assignmentId]: 'success' }));

        // Cache the submission status in localStorage
        setCachedSubmissionStatus(effectiveCourseId, assignmentId, true);

        setAssignments(prev =>
          prev.map(a =>
            a.id === assignmentId
              ? { ...a, submitted: true, submitted_at: new Date().toISOString() }
              : a
          )
        );
      } else {
        // Handle API-level errors (success: false)
        console.error('Assignment submission failed:', data.message);
        setUploadStatus(prev => ({ ...prev, [assignmentId]: 'error' }));
        toast.error(data.message || 'Failed to submit assignment. Please try again.');
      }
    } catch (err: any) {
      console.error('Failed to submit assignment:', err);
      setUploadStatus(prev => ({ ...prev, [assignmentId]: 'error' }));

      // Show user-friendly error message
      const errorMessage = err.message || 'Failed to submit assignment. Please check your network connection and try again.';
      toast.error(errorMessage);
    } finally {
      setUploading(null);
      setSelectedFile(null);
    }
  };


  //download pdf file function - uses protected endpoint with authentication
  const handleDownloadPDF = async (
    pdfUrl: string,
    assignmentName: string,
    assignmentId: number
  ) => {
    if (!pdfUrl) {
      console.error('No PDF URL provided');
      toast.error('No PDF file available for this assignment.');
      return;
    }

    // Find assignment to get its course info if props are missing
    const assignment = assignments.find(a => a.id === assignmentId);
    const effectiveCourseId = courseId || assignment?.course_id;
    const effectiveCourseUrl = courseUrl || assignment?.course_url;

    if (!effectiveCourseId || !effectiveCourseUrl) {
      console.error('Missing course ID or URL for download');
      // Fallback to direct URL if possible
      if (pdfUrl) {
        window.open(pdfUrl, '_blank');
      }
      return;
    }

    // Use protected endpoint with authentication instead of direct media URL
    const protectedPdfUrl = `/courses/${effectiveCourseId}/${effectiveCourseUrl}/assignments/${assignmentId}/pdf`;

    try {
      const response = await api.get(protectedPdfUrl, {
        responseType: 'blob',
      });

      // Axios returns the blob in response.data when responseType: 'blob' is set
      const blob = response.data;

      // Verify blob is not empty
      if (blob.size === 0) {
        toast.error('The downloaded PDF is empty. Please try again.');
        return;
      }

      // Create download link
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;

      // Ensure proper extension from original URL if possible
      let extension = '.pdf';
      try {
        const urlObj = new URL(pdfUrl, window.location.origin);
        const pathname = urlObj.pathname;
        const lastDotIndex = pathname.lastIndexOf('.');
        if (lastDotIndex !== -1) {
          extension = pathname.substring(lastDotIndex);
        }
      } catch (e) {
        console.warn('Could not parse extension from URL, defaulting to .pdf');
      }

      // Ensure proper filename
      const sanitizedName = assignmentName.replace(/[^a-zA-Z0-9-_]/g, '_');
      link.download = `${sanitizedName}${extension}`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

    } catch (err) {
      console.error('Failed to download PDF:', err);

      // Fallback to direct URL for any fetch errors
      if (pdfUrl && (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://') || pdfUrl.startsWith('/'))) {
        console.log('Attempting fallback to direct URL due to error...');
        window.open(pdfUrl, '_blank');
      } else {
        toast.error('Failed to download PDF. Please make sure you are logged in and try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="assignments-loading">
        <div className="loading-spinner"></div>
        <p>Loading assignments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assignments-error">
        <AlertCircle size={24} />
        <p>{error}</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="assignments-empty">
        <FileText size={48} />
        <h3>No Assignments Available</h3>
        <p>There are no optional assignments for this course yet.</p>
      </div>
    );
  }

  return (
    <div className="assignments-container">
      <div className="assignments-header">
        <h2>Course Assignments</h2>
        <p className="assignments-subtitle">
          Download assignment PDFs, complete them, and submit your solutions
        </p>
      </div>

      <div className="assignments-list">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="assignment-card">
            <div className="assignment-header">
              <div className="assignment-info">
                <FileText size={20} className="assignment-icon" />
                <div>
                  <h3 className="assignment-name">{assignment.name}</h3>
                  <span className={`assignment-type ${assignment.assignment_type}`}>
                    {assignment.assignment_type}
                  </span>
                </div>
              </div>

              {assignment.submitted ? (
                <div className="submission-status submitted">
                  <CheckCircle size={18} />
                  <span>Submitted</span>
                </div>
              ) : (
                <div className="submission-status pending">
                  <Clock size={18} />
                  <span>Pending</span>
                </div>
              )}
            </div>

            <div className="assignment-actions">
              <button
                className="download-btn"
                onClick={() => handleDownloadPDF(assignment.pdf, assignment.name, assignment.id)}
                disabled={!assignment.pdf}
              >
                <FileText size={16} />
                Download PDF
              </button>

              <div className="upload-section">
                <input
                  type="file"
                  id={`file-upload-${assignment.id}`}
                  accept=".pdf,.zip,.py,.ipynb,.txt"
                  onChange={(e) => handleFileSelect(e, assignment.id, assignment.section_url)}
                  disabled={uploading === assignment.id || assignment.submitted}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor={`file-upload-${assignment.id}`}
                  className={`upload-btn ${uploading === assignment.id ? 'loading' : ''}
                   ${uploadStatus[assignment.id] === 'success' ? 'success' : ''} ${assignment.submitted ? 'submitted' : ''}`}
                  style={assignment.submitted ? { pointerEvents: 'none', opacity: 0.7 } : {}}
                >
                  {assignment.submitted ? (
                    <>
                      <CheckCircle size={16} />
                      Submitted
                    </>
                  ) : uploading === assignment.id ? (
                    <>
                      <Upload size={16} />
                      Uploading...
                    </>
                  ) : uploadStatus[assignment.id] === 'success' ? (
                    <>
                      <CheckCircle size={16} />
                      Submitted!
                    </>
                  ) : uploadStatus[assignment.id] === 'error' ? (
                    <>
                      <AlertCircle size={16} />
                      Try Again
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Submit Solution
                    </>
                  )}
                </label>
              </div>
            </div>

            {assignment.submitted_at && (
              <p className="submitted-date">
                Submitted on: {new Date(assignment.submitted_at).toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Assignments;
