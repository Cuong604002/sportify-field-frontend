import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

// BookingCreatePage - redirects to the field detail page
// Actual booking form is in FieldDetailPage
export default function BookingCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fieldId = searchParams.get("fieldId");

  useEffect(() => {
    if (fieldId) {
      navigate(`/fields/${fieldId}`);
    } else {
      navigate("/fields");
    }
  }, [fieldId, navigate]);

  return null;
}
