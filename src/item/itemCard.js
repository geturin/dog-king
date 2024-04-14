import React from "react";
import { Row, Col, Card, Tooltip, OverlayTrigger } from "react-bootstrap";

const ItemCard = ({ items, onItemClick }) => {
  return (
    <Row>
      {items.map((item, index) => (
        <Col
          xs={2}
          sm={2}
          md={2}
          lg={2}
          data-id={item.id}
          key={`${item.id}-${index}`}
          style={{ padding: 0 }}
          data-type={`zo${item.details.zo} bu${item.details.bu}`}
        >
          <Card className="mb-0" onClick={() => onItemClick(item)}>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`tooltip-${item.id}`}>{item.name}</Tooltip>}
            >
              <Card.Img
                variant="top"
                src={item.img}
                style={{
                  objectFit: "cover",
                }}
              />
            </OverlayTrigger>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default ItemCard;
