import { Box, Card, CardContent, Grid, Typography } from "@mui/material";

const cards = [
  { title: "Invision score", text: "82 / 100 · Deterrence influence rating across last 12 epochs." },
  { title: "Quorum participation", text: "91% average participation on proposals in current era." },
  { title: "Delegation share", text: "3.4% of all delegated votes from governors." },
  { title: "Alerts", text: "No outstanding flags." },
];

const Invision: React.FC = () => {
  return (
    <Box className="app-page" display="flex" flexDirection="column" gap={2}>
      <Typography variant="h5">Invision</Typography>
      <Typography className="eyebrow" component="p">
        Deterrence & oversight signals
      </Typography>

      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid key={card.title} item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">{card.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.text}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Invision;
